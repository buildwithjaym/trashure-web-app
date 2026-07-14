interface ImpactCardsProps {

total:number;

weight:number;

value:number;

}


export default function ImpactCards({
total,
weight,
value
}:ImpactCardsProps){


const cards=[

{
title:"Materials Discovered",
value:total,
icon:"♻️"
},

{
title:"Materials Recovered",
value:`${weight} kg`,
icon:"🌱"
},

{
title:"Estimated Value",
value:`₱${value}`,
icon:"💰"
}

];



return (

<div className="grid gap-4 sm:grid-cols-3">


{
cards.map((card)=>(


<div
key={card.title}
className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
>


<div className="text-3xl">
{card.icon}
</div>


<p className="mt-4 text-sm text-zinc-500">
{card.title}
</p>


<h2 className="mt-2 text-3xl font-black text-zinc-900">
{card.value}
</h2>


</div>


))
}


</div>

);


}