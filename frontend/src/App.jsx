import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import jsPDF from "jspdf";


import { useState } from "react";
import axios from "axios";

function App() {

  const [ticker, setTicker] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const chartData = [];

  if (result?.history && result?.predictions) {
    result.history.forEach((price, index) => {
      chartData.push({
        day: `${index + 1}`,
        actual: Number(price),
        predicted: null,
      });
    });

    result.predictions.forEach((price, index) => {
      chartData.push({
        day: `+${index + 1}`,
        actual: null,
        predicted: Number(price),
      });
    });
  }
  const [history, setHistory] = useState(
  JSON.parse(localStorage.getItem("history")) || []
  );

  const handlePredict = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "https://stockpredict-ai.onrender.com/api/predict/" 
      );

      setResult(response.data);

      const newItem = {
        time: new Date().toLocaleTimeString(),
        ticker: response.data.ticker,
        signal: response.data.signal,
        price: response.data.current_price,
      };

      const updatedHistory = [newItem, ...history].slice(0, 5);

      setHistory(updatedHistory);
      localStorage.setItem("history", JSON.stringify(updatedHistory));

      setTimeout(() => {
      window.scrollTo({
        top: 500,
        behavior: "smooth",
      });
    }, 200);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
  if (!result) return;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Stock Prediction Report", 20, 20);

  doc.setFontSize(12);
  doc.text(`Ticker: ${result.ticker}`, 20, 40);
  doc.text(`Current Price: $${result.current_price}`, 20, 50);
  doc.text(`Signal: ${result.signal}`, 20, 60);
  doc.text(`7-Day Change: ${result.change_percent}%`, 20, 70);

  doc.text("Forecast Prices:", 20, 90);

  result.predictions.forEach((price, index) => {
    doc.text(
      `Day ${index + 1}: $${price.toFixed(2)}`,
      20,
      100 + index * 10
    );
  });

  doc.save("stock-report.pdf");
  };
  const signalColors = {
    BUY: "bg-green-500/20 text-green-400 border-green-500/30",
    SELL: "bg-red-500/20 text-red-400 border-red-500/30",
    HOLD: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">
          StockPredict AI
        </h1>

        <div className="space-x-6 text-sm text-slate-300">
          <a href="#">Home</a>
          <a href="#">Features</a>
          <a href="#">About</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">

        <h2 className="text-5xl md:text-6xl font-bold leading-tight">
          Smart Stock Forecasting <br />
          Powered by <span className="text-blue-400">LSTM AI</span>
        </h2>

        <p className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto">
          Predict future stock movement, visualize next 7 days,
          and receive Buy / Hold / Sell recommendations.
        </p>

        {/* Controls */}
        <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center items-center">

          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 w-72"
          >
            <option value="AAPL">AAPL</option>
            <option value="MSFT">MSFT (Soon)</option>
            <option value="TSLA">TSLA (Soon)</option>
            <option value="GOOG">GOOG (Soon)</option>
          </select>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}

            {loading ? "Predicting..." : "Predict Now"}
          </button>

        </div>

        {/* Result Section */}
        {result && (
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-sm">Current Price</h3>
              <p className="text-3xl font-bold mt-2">
                ${result.current_price}
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-sm">Signal</h3>

              <div
                className={`mt-4 inline-block px-5 py-2 rounded-xl border font-bold text-xl ${signalColors[result.signal]}`}
              >
                {result.signal}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-sm">7-Day Change</h3>
              <p className={`text-3xl font-bold mt-2 ${
                result.change_percent >= 0 ? "text-green-400" : "text-red-400"
              }`}>              
                {result.change_percent}%
              </p>
            </div>

          </div>
        )}

        {result && (
          <div className="mt-10 bg-slate-900 rounded-2xl border border-slate-800 p-6">
    
            <h3 className="text-xl font-bold mb-6">
              Price Forecast Chart
            </h3>

            <div className="h-96">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>

                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                   <XAxis
                     dataKey="day"
                     stroke="#94a3b8"
                     tick={{ fontSize: 12 }}
                     interval={6}
                   />

                   <YAxis
                     stroke="#94a3b8"
                     domain={['dataMin - 5', 'dataMax + 5']}
                     tick={{ fontSize: 12 }}
                   />

                   <Tooltip
                     contentStyle={{
                       backgroundColor: "#0f172a",
                       border: "1px solid #334155",
                       borderRadius: "12px",
                       color: "white"
                     }}
                   />

                   <Legend verticalAlign="top" height={36} />

                   <Line
                     type="monotone"
                     dataKey="actual"
                     stroke="#3b82f6"
                     strokeWidth={3}
                     dot={false}
                     activeDot={{ r: 5 }}
                     name="Historical"
                   />

                   <Line
                     type="monotone"
                     dataKey="predicted"
                     stroke="#f59e0b"
                     strokeWidth={3}
                     strokeDasharray="5 5"
                     dot={false}
                     activeDot={{ r: 5 }}
                     name="Forecast"
                   />

                 </LineChart>
               </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* Prediction Table */}
        {result && (
          <div className="mt-10 bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-xl font-bold mb-4">
              Next 7 Day Forecast
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.predictions.map((price, index) => (
                <div
                  key={index}
                  className="bg-slate-800 rounded-xl p-4"
                >
                  <p className="text-sm text-slate-400">
                    Day {index + 1}
                  </p>
                  <p className="text-lg font-semibold">
                    ${price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <button
            onClick={downloadPDF}
            className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold"
          >
            Download PDF Report
          </button>
        )}

        {history.length > 0 && (
          <div className="mt-10 bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-xl font-bold mb-4">
              Prediction History
            </h3>

            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between bg-slate-800 p-4 rounded-xl"
                >
                  <span>{item.time}</span>
                  <span>{item.ticker}</span>
                  <span>{item.signal}</span>
                  <span>${item.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

    </div>
  );
}

export default App;