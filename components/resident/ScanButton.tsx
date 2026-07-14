import Link from "next/link";
import { ScanLine } from "lucide-react";


export default function ScanButton(){


return (

<Link
href="/profiles/resident/scan"
className="fixed bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-700 px-8 py-4 font-bold text-white shadow-xl shadow-green-500/40 transition hover:-translate-y-1 md:static md:translate-x-0"
>


<ScanLine size={22}/>

Scan Material


</Link>

);


}