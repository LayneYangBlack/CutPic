// Temu订单扫码助手 - Content Script
(function () {
  "use strict";

  // 条码映射表：labelCode -> subPurchaseOrderSn
  const barcodeMap = {};
  // 定制内容缓存：orderSn -> customData
  const customDataCache = {};

  // 从localStorage加载已保存的数据
  function loadFromStorage() {
    try {
      const savedBarcode = localStorage.getItem("TEMU_BARCODE_MAP");
      if (savedBarcode) {
        Object.assign(barcodeMap, JSON.parse(savedBarcode));
        console.log(
          "📦 从localStorage加载条码映射:",
          Object.keys(barcodeMap).length,
          "条",
        );
      }
      const savedCustom = localStorage.getItem("TEMU_CUSTOM_DATA");
      if (savedCustom) {
        Object.assign(customDataCache, JSON.parse(savedCustom));
        console.log(
          "🎨 从localStorage加载定制内容:",
          Object.keys(customDataCache).length,
          "条",
        );
      }
    } catch (e) {
      console.error("❌ 加载localStorage失败:", e);
    }
  }
  loadFromStorage();

  // 监听来自interceptor.js的数据
  window.addEventListener("message", (event) => {
    if (event.data?.type === "TEMU_BARCODE_MAP") {
      Object.assign(barcodeMap, event.data.data);
      console.log(
        "📦 收到条码映射:",
        Object.keys(event.data.data).length,
        "条",
      );
    }

    if (event.data?.type === "TEMU_CUSTOM_DATA") {
      // 缓存定制内容数据(用personalProductSkuId作为key)
      event.data.data.forEach((item) => {
        const personalSkuId = item.personalProductSkuId;
        if (personalSkuId) {
          customDataCache[String(personalSkuId)] = item;
        }
      });
      console.log("🎨 收到定制内容:", event.data.data.length, "条");
    }
  });

  // 扫码枪输入监听
  let scanBuffer = "";
  let scanTimer = null;
  const SCAN_TIMEOUT = 100; // 扫码枪输入间隔小于100ms

  // 监听键盘输入
  document.addEventListener("keypress", (e) => {
    // 清除之前的定时器
    if (scanTimer) clearTimeout(scanTimer);

    // 累积输入
    if (e.key === "Enter") {
      // 回车表示扫码完成
      if (scanBuffer.length > 5) {
        handleScan(scanBuffer.trim());
      }
      scanBuffer = "";
    } else {
      scanBuffer += e.key;
    }

    // 设置超时清空（区分手动输入）
    scanTimer = setTimeout(() => {
      scanBuffer = "";
    }, SCAN_TIMEOUT);
  });

  // 处理扫码结果
  function handleScan(code) {
    console.log("🔍 扫码内容:", code);

    // 通过条码映射找到订单号
    const orderSn = barcodeMap[code];
    if (!orderSn) {
      showNotification("未找到条码映射,请先批量打印条码", "error");
      return;
    }

    console.log("✅ 找到personalSkuId:", orderSn);

    // 从缓存中获取定制内容(用personalProductSkuId作为key)
    const customData = customDataCache[orderSn];
    if (!customData) {
      showNotification("未找到定制内容,请先批量查看定制内容", "error");
      return;
    }

    // 在页面中查找订单行(用于高亮)
    const order = findOrderByOrderSn(orderSn);
    if (order) {
      order.row.style.backgroundColor = "#d4edda";
      setTimeout(() => {
        order.row.style.backgroundColor = "";
      }, 3000);
    }

    // 显示定制内容
    showCustomContentModal(customData, order);
  }

  // 获取mallid（根据当前店铺名称匹配）
  async function getMallId() {
    try {
      // 方式1: 从URL参数获取
      const urlParams = new URLSearchParams(window.location.search);
      const urlMallId = urlParams.get("mallId");
      if (urlMallId) {
        console.log(`✅ 从URL获取mallId: ${urlMallId}`);
        return urlMallId;
      }

      // 方式2: 从localStorage获取
      const storedMallId = localStorage.getItem("currentMallId");
      if (storedMallId) {
        console.log(`✅ 从localStorage获取mallId: ${storedMallId}`);
        return storedMallId;
      }

      // 方式3: 从window全局变量获取
      if (window.__TEMU_MALL_ID__) {
        console.log(`✅ 从全局变量获取mallId: ${window.__TEMU_MALL_ID__}`);
        return window.__TEMU_MALL_ID__;
      }

      // 方式4: 从DOM获取店铺名称并匹配
      const mallNameElement = document.querySelector(
        ".account-info_mallInfo__ts61W",
      );
      const currentMallName = mallNameElement?.textContent?.trim();
      console.log(`🔍 DOM店铺名称: ${currentMallName || "未找到"}`);

      // 方式5: 调用API获取店铺列表（兜底）
      const response = await fetch(
        "https://agentseller.temu.com/api/seller/auth/userInfo",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
          credentials: "include",
        },
      );
      const data = await response.json();

      if (data.success && data.result?.mallList?.length > 0) {
        // 根据店铺名称匹配
        if (currentMallName) {
          const matchedMall = data.result.mallList.find(
            (mall) => mall.mallName === currentMallName,
          );
          if (matchedMall) {
            console.log(
              `✅ API匹配店铺: ${currentMallName} -> ${matchedMall.mallId}`,
            );
            return matchedMall.mallId;
          }
        }
        // 返回第一个店铺
        const firstMallId = data.result.mallList[0].mallId;
        console.log(
          `⚠️ 使用第一个店铺: ${data.result.mallList[0].mallName} -> ${firstMallId}`,
        );
        return firstMallId;
      }
    } catch (error) {
      console.error("❌ 获取mallId失败:", error);
    }
    // 最终兜底值
    console.warn("⚠️ 所有方式失败，无法获取mallId");
    return null;
  }

  // 获取并显示定制内容（直接嵌入iframe，不调用API）
  async function fetchAndShowCustomContent(order) {
    // 从order.attr提取属性和数量
    const attr = order.attr || "未知属性";
    const quantityMatch = attr.match(/(\d+)件/);
    const quantity = quantityMatch ? quantityMatch[1] : "1";

    // 显示弹窗
    showCustomContentModal(order, attr, quantity);
  }

  // 显示定制内容弹窗
  function showCustomContentModal(customData, order) {
    // 移除旧弹窗
    const oldModal = document.getElementById("temu-custom-modal");
    if (oldModal) oldModal.remove();

    // 提取规格信息
    const specs =
      customData.productSkuSpecList?.map((s) => s.specName).join(" / ") || "";
    const orderSn = customData.subPurchaseOrderSnList?.[0] || "";
    const quantity =
      order?.attr?.match(/(\d+)件/)?.[1] ||
      customData.subPurchaseOrderInfoVOS?.[0]?.purchaseQuantity ||
      "1";

    // 提取定制图片(previewType=3是用户上传的原图)
    const previewItems =
      customData.productSkuCustomization?.customizedPreviewItems || [];
    const userImage = previewItems.find((item) => item.previewType === 3);
    const compositeImage = previewItems.find((item) => item.previewType === 1);

    // 创建弹窗容器（只用内联样式，确保z-index生效）
    const modal = document.createElement("div");
    modal.id = "temu-custom-modal";
    modal.style.cssText =
      "position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;display:flex;align-items:center;justify-content:center;";

    modal.innerHTML = `
      <div class="temu-scanner-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:999998;"></div>
      <div class="temu-custom-content" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:1000000;max-width:900px;max-height:90vh;overflow-y:auto;width:90%;">
        <div style="padding:20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;">📦 定制内容核对</h3>
          <button class="temu-custom-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;">✕</button>
        </div>
        <div style="padding:20px;">
          <div style="margin-bottom:20px;">
            <h4 style="margin:0 0 10px 0;color:#333;">订单信息</h4>
            <p><strong>备货单号：</strong>${orderSn}</p>
            <p><strong>规格：</strong>${specs}</p>
            <p><strong>数量：</strong>${quantity} 件</p>
          </div>
          <div style="margin-bottom:20px;">
            <h4 style="margin:0 0 10px 0;color:#333;">定制内容</h4>
            <div style="display:flex;gap:20px;justify-content:center;">
              ${
                userImage
                  ? `<div style="text-align:center;">
                <p style="margin-bottom:10px;font-weight:bold;">用户上传图</p>
                <img src="${userImage.imageUrlDisplay}" style="max-width:300px;max-height:300px;border:1px solid #ddd;border-radius:4px;" />
              </div>`
                  : ""
              }
              ${
                compositeImage
                  ? `<div style="text-align:center;">
                <p style="margin-bottom:10px;font-weight:bold;">合成效果图</p>
                <img src="${compositeImage.imageUrlDisplay}" style="max-width:300px;max-height:300px;border:1px solid #ddd;border-radius:4px;" />
              </div>`
                  : ""
              }
            </div>
          </div>
        </div>
        <div style="padding:15px 20px;border-top:1px solid #eee;display:flex;gap:10px;justify-content:flex-end;">
          <button class="temu-custom-close" style="padding:8px 16px;border:none;border-radius:4px;cursor:pointer;background:#f0f0f0;color:#333;">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 绑定关闭事件
    modal.querySelectorAll(".temu-custom-close").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });

    modal
      .querySelector(".temu-scanner-overlay")
      .addEventListener("click", () => {
        modal.remove();
      });
  }

  // 通过订单号查找订单行
  function findOrderByOrderSn(orderSn) {
    const rows = document.querySelectorAll("table tbody tr");
    for (let row of rows) {
      if (row.textContent.includes(orderSn)) {
        return extractOrderInfo(row);
      }
    }
    return null;
  }

  // 提取订单信息
  function extractOrderInfo(row) {
    const text = row.textContent;

    // 提取订单号（WB开头）
    const orderSnMatch = text.match(/WB\d+/);
    const orderSn = orderSnMatch ? orderSnMatch[0] : "";

    // 提取备货母单号（WP开头）
    const parentOrderMatch = text.match(/WP\d+/);
    const parentOrder = parentOrderMatch ? parentOrderMatch[0] : "";

    // 提取定制SKU
    const customSkuMatch = text.match(/定制SKU[：:]\s*(\d+)/);
    const customSku = customSkuMatch ? customSkuMatch[1] : "";

    // 提取商品信息（定制内容前的文字）
    const productMatch = text.match(/定制(.*?)SKC/s);
    const product = productMatch ? productMatch[1].trim() : "";

    // 查找定制内容链接（多重策略）
    let customLink = Array.from(row.querySelectorAll("a")).find((a) =>
      a.textContent.includes("定制"),
    );
    if (!customLink) {
      customLink = row.querySelector('a[href*="customize"], a[href*="custom"]');
    }
    const customUrl = customLink ? customLink.href : "";

    // 提取属性和数量
    const attrMatch = text.match(/属性[：:]\s*([^\n]+)/);
    const attr = attrMatch ? attrMatch[1].trim() : "";

    return {
      orderSn,
      parentOrder,
      customSku,
      product,
      customUrl,
      attr,
      row,
    };
  }

  // 显示订单详情弹窗
  function showOrderDetail(order) {
    // 移除旧弹窗
    const oldModal = document.getElementById("temu-scanner-modal");
    if (oldModal) oldModal.remove();

    // 创建弹窗
    const modal = document.createElement("div");
    modal.id = "temu-scanner-modal";
    modal.innerHTML = `
      <div class="temu-scanner-overlay"></div>
      <div class="temu-scanner-content">
        <div class="temu-scanner-header">
          <h3>📦 订单详情</h3>
          <button class="temu-scanner-close">✕</button>
        </div>
        <div class="temu-scanner-body">
          <div class="temu-scanner-field">
            <label>订单号：</label>
            <span class="temu-scanner-value">${order.orderSn}</span>
          </div>
          <div class="temu-scanner-field">
            <label>备货母单号：</label>
            <span class="temu-scanner-value">${order.parentOrder}</span>
          </div>
          <div class="temu-scanner-field">
            <label>定制SKU：</label>
            <span class="temu-scanner-value">${order.customSku}</span>
          </div>
          <div class="temu-scanner-field">
            <label>商品信息：</label>
            <span class="temu-scanner-value">${order.product}</span>
          </div>
          <div class="temu-scanner-field">
            <label>属性：</label>
            <span class="temu-scanner-value">${order.attr}</span>
          </div>
        </div>
        <div class="temu-scanner-footer">
          ${order.customUrl ? `<a href="${order.customUrl}" target="_blank" class="temu-scanner-btn">查看定制内容</a>` : ""}
          <button class="temu-scanner-btn temu-scanner-btn-secondary temu-scanner-close">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 高亮对应行
    order.row.style.backgroundColor = "#fff3cd";
    order.row.scrollIntoView({ behavior: "smooth", block: "center" });

    // 绑定关闭事件
    modal.querySelectorAll(".temu-scanner-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.remove();
        order.row.style.backgroundColor = "";
      });
    });

    // 点击遮罩关闭
    modal
      .querySelector(".temu-scanner-overlay")
      .addEventListener("click", () => {
        modal.remove();
        order.row.style.backgroundColor = "";
      });
  }

  // 显示通知
  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `temu-scanner-notification temu-scanner-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("temu-scanner-notification-show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("temu-scanner-notification-show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // 添加模拟扫码输入框
  function addSimulateInput() {
    if (!document.body) return; // body不存在时直接返回

    const input = document.createElement("div");
    input.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
        <div style="margin-bottom: 8px; font-size: 12px; color: #666;">模拟扫码（测试用）</div>
        <input type="text" id="temu-simulate-scan" placeholder="输入条码" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 200px; font-size: 14px;" />
        <button id="temu-simulate-btn" style="margin-left: 5px; padding: 8px 12px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">扫码</button>
      </div>
    `;
    document.body.appendChild(input);

    const btn = document.getElementById("temu-simulate-btn");
    const inputField = document.getElementById("temu-simulate-scan");

    btn.addEventListener("click", () => {
      const code = inputField.value.trim();
      if (code) {
        handleScan(code);
        inputField.value = "";
      }
    });

    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const code = inputField.value.trim();
        if (code) {
          handleScan(code);
          inputField.value = "";
        }
      }
    });
  }

  // 确保body存在后再添加输入框
  if (document.body) {
    addSimulateInput();
  } else {
    document.addEventListener("DOMContentLoaded", addSimulateInput);
  }

  console.log("✅ Temu订单扫码助手已加载");
})();
