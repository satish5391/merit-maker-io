type RazorpayWindow = Window & { Razorpay?: unknown };

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as RazorpayWindow).Razorpay) {
      resolve(true);
      return;
    }
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
