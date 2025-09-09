import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Plus,
  Bell,
  Upload,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StockCard } from "@/components/trading/StockCard";
import { TradingModal } from "@/components/trading/TradingModal";
import { Stock, Notification } from "@/types/trading";
import { getUserProfile } from "@/services/firebaseApi";
import { getUserHolding } from "@/services/userHolding";
import { createFundRequest } from "@/services/fundRequestsApi";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import {
  fetchMultipleCryptos,
  generatePriceHistory,
} from "@/services/stockApi";
import { getMerchantUpi } from "@/services/merchantApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Index = () => {
  const navigate = useNavigate();
  // Auth
  const { user } = useAuth();
  // State variables
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [tradingType, setTradingType] = useState<"BUY" | "SELL">("BUY");
  const [userHoldingForModal, setUserHoldingForModal] = useState<number>(0);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawUpi, setWithdrawUpi] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [addAmount, setAddAmount] = useState<string>("");
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const [upiId, setUpiId] = useState<string>("");
  const [qrValue, setQrValue] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [txnId, setTxnId] = useState<string>("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load data on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([loadStocks(), loadUserData(), loadMerchantUpi()]).finally(() =>
      setLoading(false)
    );
    // eslint-disable-next-line
  }, []);

  const loadMerchantUpi = async () => {
    // Hardcode a valid UPI ID - REPLACE WITH YOUR ACTUAL UPI ID
    // const hardcodedUpiId = "wellfirecryptocompany@oksbi"; // e.g., "merchant@ybl"
    const hardcodedUpiId = "7049866959@ybl";
    if (!/^[\w.-]+@[\w.-]+$/.test(hardcodedUpiId)) {
      console.error("Hardcoded UPI ID is invalid:", hardcodedUpiId);
      toast.error("Invalid UPI ID configured. Contact support.");
      return;
    }
    setUpiId(hardcodedUpiId);
    console.log("Set hardcoded UPI ID:", hardcodedUpiId);
    setQrValue(`upi://pay?pa=${hardcodedUpiId}&pn=WellFire&am=0&cu=INR`);

    // Optional: Try fetching from API as fallback
    try {
      const upiFromApi = await getMerchantUpi();
      if (upiFromApi && /^[\w.-]+@[\w.-]+$/.test(upiFromApi)) {
        console.log("uoi", upiFromApi)
        // setUpiId(upiFromApi);
        setQrValue(`upi://pay?pa=${hardcodedUpiId}&pn=WellFire&am=0&cu=INR`);
        console.log("UPI from API:", upiFromApi);
      }
    } catch (error) {
      console.warn("API UPI fetch failed, using hardcoded:", error);
    }
  };

  const loadStocks = async () => {
    try {
      const marketData = await fetchMultipleCryptos();
      const stocksData: Stock[] = marketData.map((md) => ({
        id: md.id || md.symbol,
        stock_code: md.symbol,
        stock_name: md.name || md.symbol || md.id,
        price: md.price,
        change_percent: md.changePercent,
        change_amount: md.change,
        price_history:
          md.price_history && md.price_history.length > 0
            ? md.price_history
            : generatePriceHistory(md.price),
        updated_at: new Date().toISOString(),
        sector: "Crypto",
        market_cap: md.marketCap,
        volume: md.volume,
        iconUrl: md.iconUrl || "",
      }));
      setStocks(stocksData);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      toast.error("Failed to load crypto data");
    }
  };

  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUserBalance(profile.wallet_balance);
        setPortfolioValue(profile.total_portfolio_value);
        setUserName(profile.name || null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadNotifications = async () => {
    // Notification loading removed (function does not exist)
  };

  const handleBuy = (stock: Stock) => {
    setSelectedStock(stock);
    setTradingType("BUY");
    setIsModalOpen(true);
  };

  const handleSell = (stock: Stock) => {
    getUserHolding(stock.id).then((holding) => {
      setSelectedStock(stock);
      setTradingType("SELL");
      setUserHoldingForModal(holding);
      setIsModalOpen(true);
    });
  };

  const handleTradeSuccess = () => {
    loadStocks();
  };

  const filteredStocks = stocks.filter((stock) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      stock.stock_code.toLowerCase().includes(query) ||
      stock.stock_name.toLowerCase().includes(query) ||
      query === ""
    );
  });

  const totalGainers = stocks.filter((s) => s.change_percent > 0).length;
  const totalLosers = stocks.filter((s) => s.change_percent < 0).length;

  const openUpiApp = (amount: string) => {
    if (!upiId) {
      toast.error("UPI ID not set");
      return;
    }
    const amountNum = Number(amount);
    if (amount && (isNaN(amountNum) || amountNum < 1)) {
      toast.error("Enter a valid amount");
      return;
    }
    const upiUrl = `upi://pay?pa=${upiId}&pn=WellFire&am=${amount || '0'}&cu=INR`;
    window.location.href = upiUrl;
  };

  return (
    <div className="space-y-6">
      {lastUpdated && (
        <div className="text-xs text-muted-foreground text-right">
          Last updated: {lastUpdated}
        </div>
      )}

      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center w-full gap-2 md:gap-0">
          <div className="flex-grow min-w-0 max-w-2xl overflow-visible">
            <h1 className="text-2xl md:text-3xl font-bold break-words whitespace-normal md:whitespace-pre-line md:overflow-visible md:text-ellipsis">
              Welcome back,{" "}
              {userName && userName !== user?.email ? userName : "Trader"}!
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Ready to make some trades today?
            </p>
          </div>
          <div className="hidden md:flex gap-2 items-center flex-shrink-0">
            <Button className="gap-2" onClick={() => setIsAddFundsOpen(true)}>
              <Plus className="h-4 w-4" />
              Deposit
            </Button>
            <Button
              className="gap-2"
              variant="outline"
              onClick={() => setIsWithdrawOpen(true)}
            >
              Withdraw
            </Button>
          </div>
        </div>
        <div className="flex md:hidden gap-2 mt-4">
          <Button
            className="flex-1 gap-2"
            onClick={() => setIsAddFundsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Deposit
          </Button>
          <Button
            className="flex-1 gap-2"
            variant="outline"
            onClick={() => setIsWithdrawOpen(true)}
          >
            Withdraw
          </Button>
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds to UPI</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <input
                  type="number"
                  placeholder="Enter amount to withdraw"
                  className="w-full p-2 border rounded"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={1}
                />
                <input
                  type="text"
                  placeholder="Enter your UPI ID (e.g. user@bank)"
                  className="w-full p-2 border rounded"
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                />
                <Button
                  className="w-full bg-black text-white hover:bg-gray-900 active:scale-95 transition-transform"
                  disabled={withdrawLoading || !withdrawAmount || !withdrawUpi}
                  onClick={async () => {
                    if (!user) {
                      toast.error("User not logged in");
                      return;
                    }
                    const amountNum = Number(withdrawAmount);
                    if (isNaN(amountNum) || amountNum < 1) {
                      toast.error("Enter a valid amount");
                      return;
                    }
                    if (amountNum > portfolioValue) {
                      toast.error(
                        "Withdrawal amount cannot exceed your portfolio value"
                      );
                      return;
                    }
                    const upiRegex = /^[\w.-]+@[\w.-]+$/;
                    if (!upiRegex.test(withdrawUpi)) {
                      toast.error("Enter a valid UPI ID (e.g. user@bank)");
                      return;
                    }
                    setWithdrawLoading(true);
                    try {
                      await addDoc(collection(db, "withdraw_requests"), {
                        user_id: user.uid,
                        amount: amountNum,
                        upi_id: withdrawUpi,
                        status: "PENDING",
                        created_at: serverTimestamp(),
                      });
                      toast.success(
                        "Withdrawal request submitted! Admin will verify and process."
                      );
                      setIsWithdrawOpen(false);
                      setWithdrawAmount("");
                      setWithdrawUpi("");
                    } catch (err) {
                      toast.error(
                        "Failed to submit withdrawal request. Try again."
                      );
                    }
                    setWithdrawLoading(false);
                  }}
                >
                  Submit Withdrawal Request
                </Button>
                <div className="text-xs text-muted-foreground mt-2">
                  Withdrawal requests are processed by admin. You will be
                  notified after approval.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Funds via UPI</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              type="number"
              placeholder="Enter amount"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-full"
              min={1}
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                style={{ backgroundColor: "#22c55e", color: "white", width: "100%" }}
                className="hover:bg-green-700 active:scale-95 transition-transform"
                onClick={() => openUpiApp(addAmount)}
                disabled={!upiId}
              >
                Pay with UPI
              </Button>
              <Button
                className="w-full bg-black text-white hover:bg-gray-900 active:scale-95 transition-transform"
                onClick={() => setIsUploadDialogOpen(true)}
                disabled={!addAmount || !upiId}
              >
                Continue
              </Button>
            </div>
            <div className="text-sm text-muted-foreground mt-2 text-center leading-relaxed">
              <p>
                Tap <b>Pay with UPI</b> to open your preferred UPI app (like GPay, PhonePe, Paytm).
              </p>
              <p className="mt-1">
                If it doesn’t open, manually send the amount to:
              </p>
              <p className="mt-1 font-mono text-base font-semibold">{upiId || "UPI ID loading..."}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload Payment Screenshot & Transaction ID
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Transaction ID"
              className="w-full p-2 border rounded"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
            />
            <label className="block">Payment Screenshot:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
            <Button
              className="w-full mt-2"
              disabled={isSubmitting || !txnId || !screenshot}
              onClick={async () => {
                if (!txnId || !screenshot) {
                  toast.error("Please enter transaction ID and upload screenshot");
                  return;
                }
                if (!user) {
                  toast.error("User not logged in");
                  return;
                }
                if (!/^[a-zA-Z0-9]{6,20}$/.test(txnId)) {
                  toast.error("Enter a valid transaction ID (6-20 alphanumeric characters)");
                  return;
                }
                if (screenshot.size > 5 * 1024 * 1024) {
                  toast.error("Screenshot size must be less than 5MB");
                  return;
                }
                if (!screenshot.type.startsWith('image/')) {
                  toast.error("Please upload a valid image file (JPEG/PNG)");
                  return;
                }
                const amountNum = Number(addAmount);
                if (isNaN(amountNum) || amountNum < 1) {
                  toast.error("Enter a valid amount");
                  return;
                }
                setIsSubmitting(true);
                let success = false;
                let screenshot_url = "";
                try {
                  console.log("Starting image upload...");
                  const formData = new FormData();
                  formData.append("image", screenshot);
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 30000);
                  const res = await fetch(
                    "https://lightgray-albatross-150482.hostingersite.com/upload_web.php",
                    {
                      method: "POST",
                      body: formData,
                      signal: controller.signal,
                    }
                  );
                  clearTimeout(timeoutId);
                  if (!res.ok) {
                    const text = await res.text();
                    console.error("Upload failed with status:", res.status, "Response:", text);
                    toast.error(`Image upload failed: HTTP ${res.status} - ${text}`);
                    throw new Error(`Image upload failed: ${text}`);
                  }
                  let data;
                  try {
                    data = await res.json();
                  } catch (jsonErr) {
                    const text = await res.text();
                    console.error("Invalid JSON response:", text, jsonErr);
                    throw new Error("Server response is not valid JSON: " + text);
                  }
                  screenshot_url = data.imageUrl || data.url || "";
                  console.log("Upload success, imageUrl:", screenshot_url);
                  if (!screenshot_url) {
                    throw new Error("No image URL returned from server");
                  }
                  console.log("Saving to Firestore...");
                  await addDoc(collection(db, "fund_requests"), {
                    user_id: user.uid,
                    amount: amountNum,
                    txn_id: txnId,
                    screenshot_url,
                    status: "PENDING",
                    created_at: serverTimestamp(),
                  });
                  console.log("Firestore save successful");
                  success = true;
                } catch (err: any) {
                  console.error("Deposit error:", err);
                  const errMsg = err.name === 'AbortError' ? 'Upload timeout - server too slow' : (err.message || 'Unknown error');
                  toast.error(`Failed to submit deposit request: ${errMsg}`);
                  success = false;
                }
                if (success) {
                  toast.success("Deposit request submitted! Admin will verify and approve.");
                  setIsUploadDialogOpen(false);
                  setIsAddFundsOpen(false);
                  setAddAmount("");
                  setTxnId("");
                  setScreenshot(null);
                  setSelectedUpiApp("");
                  loadUserData(); // Refresh balance
                }
                setIsSubmitting(false);
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wallet Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Value
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total portfolio value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Gainers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalGainers}
            </div>
            <p className="text-xs text-muted-foreground">stocks in green</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Losers</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalLosers}</div>
            <p className="text-xs text-muted-foreground">stocks in red</p>
          </CardContent>
        </Card>
      </div>

      <div className="w-full flex items-center justify-center mb-6">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full text-base py-3 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-16 bg-muted rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded flex-1"></div>
                  <div className="h-8 bg-muted rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onBuy={handleBuy}
              onSell={handleSell}
              onGraphClick={() => navigate(`/detail/${stock.id}`)}
            />
          ))}
        </div>
      )}

      <TradingModal
        stock={selectedStock}
        type={tradingType}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTradeSuccess}
        userBalance={userBalance}
        userHolding={tradingType === "SELL" ? userHoldingForModal : 0}
      />
    </div>
  );
};

export default Index;