export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { code } = req.body;
  const valid = Boolean(code) && code.trim() === process.env.ACCESS_CODE;

  return res.status(200).json({ valid });
}
