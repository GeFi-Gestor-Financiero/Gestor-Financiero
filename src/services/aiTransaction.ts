import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '../firebase';
import { TransactionType } from '../types';

const allowedTypes: TransactionType[] = ['Ingreso','Gasto','Inversion','Desinversion','Ahorro','Prestamo','Ef+','Ef-'];
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json', temperature: 0 },
});

export type AITransaction = { fecha:string;categoria:TransactionType;monto:number;motivo:string;categoriaDetalle:string;efectivo:boolean };

export async function interpretTransaction(text:string,categories:string[],currentDate:string):Promise<AITransaction>{
  const prompt=`Sos el intérprete de movimientos de un gestor financiero argentino. Hoy es ${currentDate}.
Interpretá el texto aunque tenga faltas ortográficas, abreviaturas o jerga argentina (por ejemplo: luca=1000, palo=1000000).
Respondé SOLO JSON válido con: fecha (YYYY-MM-DD), categoria, monto, motivo, categoriaDetalle, efectivo.
categoria debe ser una de: ${allowedTypes.join(', ')}.
categoriaDetalle debe ser una de: ${categories.join(', ')}.
Usa Alimentos para comida, bebidas, golosinas, caramelos, chocolates, budines, restaurantes y supermercados. Usa Transporte para SUBE, colectivos, trenes, taxis o combustible. Usa Hogar solamente para vivienda, servicios o artículos domésticos.
motivo debe contener ÚNICAMENTE aquello por lo que fue el movimiento, bien escrito, sin verbos, fechas, montos, moneda, preposiciones ni artículos. Ejemplos: "gasté doce pesos en unos caramleos hoy" => "Caramelos"; "pagué dos lucas por unos budines" => "Budines".
Si se menciona efectivo, usa Ef+ para entrada o Ef- para salida y efectivo=true. Para un gasto común usa Gasto. No inventes importes.
Texto: ${JSON.stringify(text)}`;
  const result=await model.generateContent(prompt);
  const parsed=JSON.parse(result.response.text().replace(/^```json\s*|\s*```$/g,''));
  const categoria=allowedTypes.includes(parsed.categoria)?parsed.categoria:null;
  const monto=Number(parsed.monto);
  if(!categoria||!Number.isFinite(monto)||monto<=0||!/^\d{4}-\d{2}-\d{2}$/.test(parsed.fecha||''))throw new Error('Respuesta de IA inválida');
  const detail=String(parsed.motivo||'').trim();
  return {fecha:parsed.fecha,categoria,monto,motivo:detail.charAt(0).toUpperCase()+detail.slice(1),categoriaDetalle:categories.includes(parsed.categoriaDetalle)?parsed.categoriaDetalle:(categories[0]||'General'),efectivo:Boolean(parsed.efectivo)};
}
