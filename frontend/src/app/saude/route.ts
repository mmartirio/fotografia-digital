// Healthcheck do container frontend (não depende do backend)
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "UP" });
}
