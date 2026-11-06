import { Suspense } from "react";
import { EntrarComToken } from "@/components/cliente/EntrarComToken";

export default function Entrar() {
  return (
    <main className="container-site flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12">
      <Suspense>
        <EntrarComToken />
      </Suspense>
    </main>
  );
}
