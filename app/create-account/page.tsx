"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ImagePlus,
    Loader2
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";


const steps = [
    "Account",
    "Profile",
    "Location",
    "Role"
];


const roles = [
    {
        value: "resident",
        title: "Resident",
        description: "Scan materials and discover their circular value."
    },
    {
        value: "school_partner",
        title: "School / Community Partner",
        description: "Receive materials for sustainability projects."
    },
    {
        value: "recycler_partner",
        title: "Recycler Partner",
        description: "Connect recycling opportunities and materials."
    }
];



export default function CreateAccountPage() {


    const router = useRouter();

    const supabase = createClient();


    const [step, setStep] = useState(1);

    const [loading, setLoading] = useState(false);

    const [uploading, setUploading] = useState(false);


    const [preview, setPreview] = useState("");

    const [avatar, setAvatar] = useState<File | null>(null);



    const [form, setForm] = useState({

        full_name: "",
        email: "",
        password: "",
        age: "",
        sex: "",
        barangay: "",
        city: "",
        province: "",
        role: ""

    });





    const updateField = (field: string, value: string) => {

        setForm(prev => ({
            ...prev,
            [field]: value
        }));

    };





    const handleImage = (file: File) => {


        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (!allowed.includes(file.type)) {

            toast.error("Only JPG, PNG, and WEBP images are allowed.");

            return;

        }



        if (file.size > 5 * 1024 * 1024) {

            toast.error("Image size must be below 5MB.");

            return;

        }



        setAvatar(file);

        setPreview(URL.createObjectURL(file));


    };






    const nextStep = () => {


        if (step === 1) {

            if (!form.full_name || !form.email || !form.password) {

                toast.error("Complete your account information.");

                return;

            }

        }



        if (step === 2) {

            if (!form.age || !form.sex || !avatar) {

                toast.error("Add your profile information and photo.");

                return;

            }

        }



        if (step === 3) {

            if (!form.barangay || !form.city || !form.province) {

                toast.error("Complete your location.");

                return;

            }

        }



        setStep(prev => prev + 1);


    };






    const createAccount = async () => {


        if (!form.role) {

            toast.error("Select your account type.");

            return;

        }



        setLoading(true);



        try {


            // CREATE AUTH USER


            const { data: userData, error: userError } = await supabase.auth.signUp({

                email: form.email,

                password: form.password

            });



            if (userError) {

                toast.error(userError.message);

                return;

            }



            if (!userData.user) {

                toast.error("Unable to create account.");

                return;

            }





            let avatarUrl = "";





            // UPLOAD IMAGE


            if (avatar) {


                setUploading(true);


                const fileExt =
                    avatar.name.split(".").pop();


                const filePath =
                    `${userData.user.id}/profile.${fileExt}`;



                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(
                        filePath,
                        avatar,
                        {
                            upsert: true
                        }
                    );



                if (uploadError) {

                    toast.error(uploadError.message);

                    return;

                }





                const {
                    data: urlData
                } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(filePath);



                avatarUrl = urlData.publicUrl;



                setUploading(false);


            }







            // CREATE PROFILE


            const { error: profileError } = await supabase
                .from("profiles")
                .insert({

                    auth_id: userData.user.id,

                    full_name: form.full_name,

                    email: form.email,

                    avatar_url: avatarUrl,

                    age: Number(form.age),

                    sex: form.sex,

                    barangay: form.barangay,

                    city: form.city,

                    province: form.province,

                    role: form.role,

                    onboarding_completed: true

                });





            if (profileError) {

                toast.error(profileError.message);

                return;

            }




            toast.success("You successfully created your account!");

            router.push("/login");



        }
        catch {

            toast.error("Something went wrong.");

        }
        finally {

            setLoading(false);

            setUploading(false);

        }



    };







    return (

        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4 py-8">



            <div className="w-full max-w-xl rounded-[32px] border border-green-100 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-10">



                <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-green-600">

                    <ArrowLeft size={18} />

                    Back

                </Link>






                <div className="mt-8 flex justify-between">

                    {steps.map((item, index) => {

                        const active = index + 1 === step;

                        const done = index + 1 < step;


                        return (

                            <div key={item} className="flex flex-col items-center gap-2">


                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active || done ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>

                                    {
                                        done
                                            ?
                                            <Check size={18} />
                                            :
                                            index + 1
                                    }

                                </div>


                                <span className="text-xs font-medium">

                                    {item}

                                </span>


                            </div>

                        )

                    })}

                </div>






                <h1 className="mt-10 text-3xl font-black text-zinc-900">

                    Create your Trashure account

                </h1>





                {step === 1 && (

                    <div className="mt-6 space-y-4">


                        <input placeholder="Full name" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-green-500" />


                        <input placeholder="Email address" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-green-500" />


                        <input type="password" placeholder="Password" value={form.password} onChange={(e) => updateField("password", e.target.value)} className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-green-500" />


                    </div>

                )}






                {step === 2 && (

                    <div className="mt-6 space-y-5">


                        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-green-200 p-6 text-center hover:bg-green-50">


                            {
                                preview
                                    ?
                                    <img src={preview} className="mx-auto h-28 w-28 rounded-full object-cover" />
                                    :
                                    <div>

                                        <ImagePlus className="mx-auto text-green-600" />

                                        <p className="mt-3 font-medium">
                                            Upload profile photo
                                        </p>

                                        <p className="text-sm text-zinc-500">
                                            JPG PNG WEBP • Max 5MB
                                        </p>

                                    </div>

                            }



                            <input
                                hidden
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => e.target.files && handleImage(e.target.files[0])}
                            />


                        </label>





                        <input placeholder="Age" type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} className="w-full rounded-xl border p-3" />



                        <select value={form.sex} onChange={(e) => updateField("sex", e.target.value)} className="w-full rounded-xl border p-3">

                            <option value="">
                                Select sex
                            </option>

                            <option value="male">
                                Male
                            </option>

                            <option value="female">
                                Female
                            </option>

                            <option value="prefer_not">
                                Prefer not to say
                            </option>


                        </select>


                    </div>

                )}






                {step === 3 && (

                    <div className="mt-6 space-y-4">

                        <input placeholder="Barangay" value={form.barangay} onChange={(e) => updateField("barangay", e.target.value)} className="w-full rounded-xl border p-3" />

                        <input placeholder="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full rounded-xl border p-3" />

                        <input placeholder="Province" value={form.province} onChange={(e) => updateField("province", e.target.value)} className="w-full rounded-xl border p-3" />

                    </div>

                )}







                {step === 4 && (

                    <div className="mt-6 space-y-3">


                        {roles.map(role => (


                            <button
                                key={role.value}
                                onClick={() => updateField("role", role.value)}
                                className={`w-full rounded-2xl border p-5 text-left transition ${form.role === role.value ? "border-green-600 bg-green-50" : "border-zinc-200 hover:border-green-300"}`}
                            >


                                <h3 className="font-bold">

                                    {role.title}

                                </h3>


                                <p className="mt-1 text-sm text-zinc-500">

                                    {role.description}

                                </p>


                            </button>


                        ))}


                    </div>

                )}







                <div className="mt-8 flex justify-between">


                    {step > 1 && (

                        <button onClick={() => setStep(step - 1)} className="rounded-xl border px-5 py-3">

                            Back

                        </button>

                    )}



                    {
                        step < 4
                            ?

                            <button onClick={nextStep} className="ml-auto flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-white">

                                Next

                                <ArrowRight size={18} />

                            </button>

                            :

                            <button disabled={loading} onClick={createAccount} className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 px-6 py-3 text-white disabled:opacity-60">

                                {
                                    loading || uploading
                                        ?
                                        <Loader2 className="animate-spin" />
                                        :
                                        "Create Account"
                                }

                            </button>

                    }


                </div>




            </div>


        </main>

    );

}