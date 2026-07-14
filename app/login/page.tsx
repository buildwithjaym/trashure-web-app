"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";


export default function LoginPage() {


    const router = useRouter();

    const supabase = createClient();


    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [attempts, setAttempts] = useState(0);

    const [cooldown, setCooldown] = useState(0);



    useEffect(() => {


        if (cooldown <= 0) return;


        const timer = setInterval(() => {


            setCooldown((prev) => prev - 1);


        }, 1000);



        return () => clearInterval(timer);



    }, [cooldown]);






    const handleLogin = async () => {


        if (cooldown > 0) {

            toast.warning(`Please wait ${cooldown} seconds before trying again.`);

            return;

        }



        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



        if (!email) {

            toast.error("Email is required.");

            return;

        }



        if (!emailPattern.test(email)) {

            toast.error("Invalid email format.");

            return;

        }



        if (!password) {

            toast.error("Password is required.");

            return;

        }



        setLoading(true);



        try {


            const { data, error } = await supabase.auth.signInWithPassword({

                email,

                password

            });



            if (error || !data.user) {


                const newAttempts = attempts + 1;


                setAttempts(newAttempts);


                toast.error("Invalid email or password.");



                if (newAttempts >= 5) {


                    toast.error("Too many attempts. Try again after 30 seconds.");

                    setCooldown(30);

                    setAttempts(0);


                }



                return;


            }






            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id,full_name,role")
                .eq("auth_id", data.user.id)
                .single();





            if (profileError || !profile) {


                toast.error("Profile not found. Please complete registration.");

                await supabase.auth.signOut();


                return;


            }





            if (!profile.role) {


                toast.error("Account role is missing.");

                return;


            }





            toast.success(`Welcome back ${profile.full_name}`);


            router.push("/profiles");



        }
        catch {


            toast.error("Something went wrong.");

        }
        finally {


            setLoading(false);


        }


    };





    const googleLogin = () => {

        toast.info("Google login will be connected soon.");

    };





    return (

        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-green-50 to-emerald-100 px-4">


            <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-300/30 blur-3xl" />


            <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />




            <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">





                <div className="hidden lg:block">


                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg">

                        <img src="/logo.png" alt="Trashure Logo" className="h-full w-full object-contain" />

                    </div>




                    <h1 className="mt-8 text-5xl font-black leading-tight text-zinc-900">

                        Turn Trash

                        <br />

                        Into Treasure.

                    </h1>



                    <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-600">

                        AI-powered circular economy platform that discovers the value of discarded materials.

                    </p>


                </div>






                <section className="mx-auto w-full max-w-md rounded-3xl border border-green-100 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">





                    <div className="mb-5 flex justify-center lg:hidden">

                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">

                            <img src="/logo.png" alt="Trashure Logo" className="h-full w-full object-contain" />

                        </div>

                    </div>





                    <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-green-600">

                        <ArrowLeft size={18} />

                        Back

                    </Link>





                    <h2 className="mt-6 text-center text-3xl font-black text-zinc-900">

                        Welcome Back

                    </h2>



                    <p className="mt-2 text-center text-sm text-zinc-500">

                        Sign in to continue your Trashure journey.

                    </p>





                    <div className="mt-7 space-y-4">





                        <div>


                            <label className="text-sm font-medium text-zinc-700">

                                Email

                            </label>


                            <div className="relative mt-2">


                                <Mail className="absolute left-4 top-3.5 text-zinc-400" size={18} />


                                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" className="w-full rounded-xl border border-zinc-200 py-3 pl-11 outline-none transition focus:ring-2 focus:ring-green-500" />


                            </div>


                        </div>






                        <div>


                            <label className="text-sm font-medium text-zinc-700">

                                Password

                            </label>


                            <div className="relative mt-2">


                                <Lock className="absolute left-4 top-3.5 text-zinc-400" size={18} />



                                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Enter your password" className="w-full rounded-xl border border-zinc-200 py-3 pl-11 pr-11 outline-none transition focus:ring-2 focus:ring-green-500" />




                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-zinc-400">

                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                                </button>



                            </div>


                        </div>






                        <button disabled={loading || cooldown > 0} onClick={handleLogin} className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-700 py-3.5 font-semibold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1 disabled:opacity-60">

                            {loading ? <Loader2 className="animate-spin" /> : cooldown > 0 ? `Try again ${cooldown}s` : "Sign In"}

                        </button>





                        <div className="flex items-center gap-3 py-2">

                            <div className="h-px flex-1 bg-zinc-200" />

                            <span className="text-xs text-zinc-400">

                                OR

                            </span>


                            <div className="h-px flex-1 bg-zinc-200" />

                        </div>






                        <button onClick={googleLogin} className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 py-3.5 font-semibold transition hover:bg-zinc-50">

                            <span className="text-lg font-bold text-blue-600">

                                G

                            </span>

                            Continue with Google

                        </button>






                        <p className="pt-3 text-center text-sm text-zinc-500">

                            Don't have an account?


                            <Link href="/create-account" className="ml-1 font-semibold text-green-600">

                                Create Account

                            </Link>


                        </p>





                    </div>



                </section>



            </div>


        </main>

    );

}