// Temu订单扫码助手 - API拦截器（MAIN环境）
(function () {
  "use strict";

  const PAGE_TYPE = window.location.pathname.includes("/main/customize-goods")
    ? "CUSTOM"
    : "ORDER";
  console.log("🚀 API拦截器启动...", PAGE_TYPE);

  // 拦截fetch
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    return originalFetch.apply(this, args).then((response) => {
      // 拦截条码映射API
      if (url.includes("printProductSkuLabelForCustomPurchaseOrder")) {
        console.log("🎯 命中条码API (fetch)");
        const clonedResponse = response.clone();
        clonedResponse
          .json()
          .then((data) => {
            if (data.success && data.result?.list) {
              const barcodeMap = {};
              data.result.list.forEach((item) => {
                const labelCode = item.labelCodeVO?.labelCode;
                const personalSkuId = item.labelCodeVO?.personalProductSkuId;
                if (labelCode && personalSkuId) {
                  barcodeMap[String(labelCode)] = String(personalSkuId);
                  console.log(
                    `✅ 拦截条码映射: ${labelCode} -> ${personalSkuId}`,
                  );
                }
              });
              // 保存到localStorage(跨页面共享)
              const saved = JSON.parse(
                localStorage.getItem("TEMU_BARCODE_MAP") || "{}",
              );
              Object.assign(saved, barcodeMap);
              localStorage.setItem("TEMU_BARCODE_MAP", JSON.stringify(saved));
              window.postMessage(
                { type: "TEMU_BARCODE_MAP", data: barcodeMap },
                "*",
              );
              console.log("💾 条码映射已保存到localStorage");
            }
          })
          .catch((err) => console.error("❌ 解析条码API失败:", err));
      }

      // 拦截定制内容API
      if (url.includes("/customizeSku/pageQuery")) {
        console.log("🎯 命中定制内容API (fetch)");
        const clonedResponse = response.clone();
        clonedResponse
          .json()
          .then((data) => {
            if (data.success && data.result?.pageItems) {
              // 保存到localStorage(跨页面共享),用personalProductSkuId作为key
              const saved = JSON.parse(
                localStorage.getItem("TEMU_CUSTOM_DATA") || "{}",
              );
              data.result.pageItems.forEach((item) => {
                const personalSkuId = item.personalProductSkuId;
                if (personalSkuId) {
                  saved[String(personalSkuId)] = item;
                }
              });
              localStorage.setItem("TEMU_CUSTOM_DATA", JSON.stringify(saved));
              window.postMessage(
                { type: "TEMU_CUSTOM_DATA", data: data.result.pageItems },
                "*",
              );
              console.log(
                `✅ 拦截定制内容: ${data.result.pageItems.length}条, 已保存到localStorage`,
              );
            }
          })
          .catch((err) => console.error("❌ 解析定制内容API失败:", err));
      }
      return response;
    });
  };

  // 拦截XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (
      this._url &&
      this._url.includes("printProductSkuLabelForCustomPurchaseOrder")
    ) {
      console.log("🎯 命中条码API (XHR)");
      this.addEventListener("load", function () {
        try {
          const data = JSON.parse(this.responseText);
          if (data.success && data.result?.list) {
            const barcodeMap = {};
            data.result.list.forEach((item) => {
              const labelCode = item.labelCodeVO?.labelCode;
              const orderSn = item.subPurchaseOrderSn;
              if (labelCode && orderSn) {
                barcodeMap[String(labelCode)] = orderSn;
                console.log(`✅ 拦截条码映射: ${labelCode} -> ${orderSn}`);
              }
            });
            // 发送给content.js
            window.postMessage(
              { type: "TEMU_BARCODE_MAP", data: barcodeMap },
              "*",
            );
          }
        } catch (err) {
          console.error("❌ 解析条码API失败:", err);
        }
      });
    }
    return originalXHRSend.apply(this, args);
  };

  // 监听content.js请求获取定制内容
  window.addEventListener("message", (event) => {
    if (event.data?.type === "TEMU_FETCH_CUSTOM") {
      const orderSns = event.data.orderSns;
      console.log("📡 收到请求,获取定制内容:", orderSns);

      // 从页面获取mallId
      const mallId =
        document.querySelector('[class*="mallInfo"]')?.closest("[data-mall-id]")
          ?.dataset?.mallId ||
        new URLSearchParams(window.location.search).get("mallId") ||
        document.cookie.match(/mallId=(\d+)/)?.[1] ||
        "";

      fetch(
        "https://agentseller.temu.com/bg-luna-agent-seller/product/customizeSku/pageQuery",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            mallid: mallId,
          },
          body: JSON.stringify({
            page: 1,
            pageSize: 100,
            subPurchaseOrderSns: orderSns,
          }),
          credentials: "include",
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.result?.pageItems) {
            window.postMessage(
              { type: "TEMU_CUSTOM_DATA", data: data.result.pageItems },
              "*",
            );
            console.log(
              "✅ 获取定制内容成功:",
              data.result.pageItems.length,
              "条",
            );
          } else {
            console.error("❌ 获取定制内容失败:", data.errorMsg);
          }
        })
        .catch((err) => console.error("❌ 请求定制内容失败:", err));
    }
  });

  console.log("✅ API拦截器注入完成");
})();
