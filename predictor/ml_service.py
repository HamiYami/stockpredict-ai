import os
import numpy as np
import yfinance as yf
import joblib

from tensorflow.keras.models import load_model


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "aapl_lstm_model.h5")
SCALER_PATH = os.path.join(BASE_DIR, "ml_models", "aapl_scaler.save")


model = load_model(MODEL_PATH, compile=False)
scaler = joblib.load(SCALER_PATH)


def predict_aapl():

    data = yf.download("AAPL", period="90d")
    data.columns = data.columns.get_level_values(0)

    close_prices = data[['Close']]

    scaled = scaler.transform(close_prices)

    last_60 = scaled[-60:]

    future_predictions = []

    current_batch = last_60.copy()

    for _ in range(7):

        pred = model.predict(
            current_batch.reshape(1, 60, 1),
            verbose=0
        )

        future_predictions.append(pred[0][0])

        current_batch = np.append(current_batch[1:], pred)

    future_predictions = scaler.inverse_transform(
        np.array(future_predictions).reshape(-1,1)
    )

    current_price = float(close_prices.iloc[-1][0])
    future_price = float(future_predictions[-1][0])

    change = ((future_price - current_price) / current_price) * 100

    if change > 2:
        signal = "BUY"
    elif change < -2:
        signal = "SELL"
    else:
        signal = "HOLD"

    return {
    "ticker": "AAPL",
    "current_price": round(current_price, 2),
    "history": close_prices["Close"].tail(60).round(2).tolist(),
    "predictions": future_predictions.flatten().round(2).tolist(),
    "signal": signal,
    "change_percent": round(change, 2)
}