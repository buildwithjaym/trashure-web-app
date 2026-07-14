"use client";

import { Camera, Upload } from "lucide-react";


interface ScanCaptureProps {

onImageSelected:(file:File)=>void;

}



export default function ScanCapture({
onImageSelected
}:ScanCaptureProps){



return (

<div className="space-y-5">



<label className="flex cursor-pointer flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-green-200 bg-green-50 p-10 transition hover:bg-green-100">


<div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-white shadow-lg">


<Camera size={36}/>


</div>



<h2 className="mt-5 text-xl font-black text-zinc-900">

Take a Photo

</h2>



<p className="mt-2 text-center text-sm text-zinc-500">

Point your camera at a material to discover its value.

</p>



<input

type="file"

accept="image/*"

capture="environment"

hidden

onChange={(e)=>{

const file=e.target.files?.[0];

if(file){

onImageSelected(file);

}

}}

 />



</label>







<label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white py-4 font-semibold text-zinc-700 transition hover:bg-zinc-50">


<Upload size={20}/>

Choose from Gallery


<input

type="file"

accept="image/*"

hidden

onChange={(e)=>{

const file=e.target.files?.[0];

if(file){

onImageSelected(file);

}

}}

 />


</label>



</div>

);


}