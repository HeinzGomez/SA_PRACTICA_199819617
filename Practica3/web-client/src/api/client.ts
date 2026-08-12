import axios from "axios";

// Cliente HTTP hacia el API Gateway (unico punto de entrada north-south).
// El navegador NUNCA habla directamente con los microservicios internos.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:8080/api",
  withCredentials: true, // envia la Session Cookie (HttpOnly/Secure)
});
