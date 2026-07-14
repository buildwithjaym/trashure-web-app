export default function ScanLoading(){


return (

<div className="rounded-3xl bg-white p-8 text-center shadow-xl">


<div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-green-200 border-t-green-600"/>



<h2 className="mt-6 text-xl font-black">

Analyzing your material...

</h2>



<div className="mt-5 space-y-3 text-sm text-zinc-500">


<p>
📷 Processing image
</p>


<p>
🧠 Understanding material
</p>


<p>
🌱 Finding circular opportunities
</p>


</div>


</div>

);


}