import axios from "axios";

const axiosClient = axios.create();

axiosClient.defaults.baseURL = "https://aiml-attendance.onrender.com";

export default axiosClient;