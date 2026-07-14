interface Scan{

id:string;

detected_object:string|null;

material_type:string|null;

confidence_score:number|null;

created_at:string;

}



export default function RecentScans({
scans
}:{
scans:Scan[]
}){


return (

<div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">


<h2 className="text-lg font-bold text-zinc-900">
Recent Discoveries
</h2>


<div className="mt-5 space-y-3">


{
scans.length===0

?

<p className="text-sm text-zinc-500">
No discoveries yet. Start scanning materials.
</p>


:


scans.map(scan=>(


<div
key={scan.id}
className="rounded-2xl bg-green-50 p-4"
>


<h3 className="font-bold text-zinc-900">

{scan.detected_object || "Unknown Material"}

</h3>


<p className="text-sm text-zinc-600">

{scan.material_type}

</p>


<p className="mt-1 text-xs text-green-700">

Confidence:
{scan.confidence_score || 0}%

</p>


</div>


))


}


</div>


</div>

);


}