import { engineCatalog } from "@/lib/engineCatalog";

export default function handler(req, res) {
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  return res.status(200).json({
    success: true,
    engines: engineCatalog,
  });
}
