"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, ScanLine, Leaf, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


const navigation = [
    {
        name: "Home",
        href: "/profiles/resident",
        icon: Home
    },
    {
        name: "History",
        href: "/profiles/resident/history",
        icon: History
    },
    {
        name: "Impact",
        href: "/profiles/resident/impact",
        icon: Leaf
    },
    {
        name: "Profile",
        href: "/profiles/resident/profile",
        icon: User
    }
];



export default function ResidentLayout({
    children
}: {
    children: React.ReactNode
}) {


    const pathname = usePathname();

    const router = useRouter();

    const supabase = createClient();





    const logout = async () => {


        await supabase.auth.signOut();


        toast.success("Logged out successfully.");


        router.push("/login");


    };





    return (

        <div className="min-h-screen bg-green-50">



            {/* DESKTOP TOPBAR */}


            <header className="sticky top-0 z-30 hidden border-b border-green-100 bg-white/80 backdrop-blur-xl md:block">


                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">


                    <Link href="/profiles/resident" className="flex items-center gap-3">


                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow">

                            <img src="/logo.png" alt="Trashure" className="h-full w-full object-contain" />

                        </div>


                        <div>

                            <h1 className="font-black text-zinc-900">
                                Trashure
                            </h1>

                            <p className="text-xs text-green-600">
                                Material Intelligence
                            </p>

                        </div>


                    </Link>





                    <nav className="flex items-center gap-2">


                        {navigation.map((item) => {


                            const Icon = item.icon;


                            const active = pathname === item.href;



                            return (

                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${active ? "bg-green-600 text-white" : "text-zinc-600 hover:bg-green-50 hover:text-green-700"}`}
                                >


                                    <Icon size={17} />

                                    {item.name}


                                </Link>

                            )

                        })}



                    </nav>





                    <button
                        onClick={logout}
                        className="flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                    >

                        <LogOut size={17} />

                        Logout

                    </button>


                </div>


            </header>







            {/* PAGE CONTENT */}


            <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:px-8 md:pb-10">


                {children}


            </main>







            {/* MOBILE BOTTOM NAV */}


            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-green-100 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">


                <div className="flex items-center justify-between">


                    <Link
                        href="/profiles/resident"
                        className={`flex flex-col items-center gap-1 text-xs ${pathname === "/profiles/resident" ? "text-green-600" : "text-zinc-500"}`}
                    >

                        <Home size={22} />

                        Home

                    </Link>





                    <Link
                        href="/profiles/resident/history"
                        className="flex flex-col items-center gap-1 text-xs text-zinc-500"
                    >

                        <History size={22} />

                        History

                    </Link>





                    {/* CENTER SCAN BUTTON */}


                    <Link
                        href="/profiles/resident/scan"
                        className="relative -mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-700 text-white shadow-xl shadow-green-500/40 transition hover:-translate-y-1"
                    >


                        <ScanLine size={28} />


                    </Link>





                    <Link
                        href="/profiles/resident/impact"
                        className="flex flex-col items-center gap-1 text-xs text-zinc-500"
                    >

                        <Leaf size={22} />

                        Impact

                    </Link>





                    <Link
                        href="/profiles/resident/profile"
                        className="flex flex-col items-center gap-1 text-xs text-zinc-500"
                    >

                        <User size={22} />

                        Profile

                    </Link>



                </div>


            </nav>



        </div>

    );


}