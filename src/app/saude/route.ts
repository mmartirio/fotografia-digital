// Verificação de saúde (smoke test / monitoramento)
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "UP" });
}
