import axios from "axios";

const api = axios.create({
  baseURL: "https://exchangeapp.silvernetsystems.com",
});

export default api;
