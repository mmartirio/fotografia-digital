import { Revelar } from "./Revelar";

export function TituloSecao({
  etiqueta,
  titulo,
  subtitulo,
  centralizado = false,
  semMargem = false,
}: {
  etiqueta: string;
  titulo: string;
  subtitulo?: string;
  centralizado?: boolean;
  /** Sem margem inferior (quando o título divide a linha com outro elemento). */
  semMargem?: boolean;
}) {
  return (
    <Revelar
      className={`flex flex-col gap-4 ${semMargem ? "" : "mb-12 md:mb-16"} ${centralizado ? "items-center text-center" : ""}`}
    >
      <p className="etiqueta">{etiqueta}</p>
      <h2 className="max-w-2xl text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">{titulo}</h2>
      {subtitulo && <p className="max-w-xl text-lg text-texto-suave">{subtitulo}</p>}
    </Revelar>
  );
}
