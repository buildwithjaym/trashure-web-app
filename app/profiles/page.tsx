import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";


export default async function ProfilesPage() {


    const supabase = await createClient();



    const {
        data: {
            user
        }

    } = await supabase.auth.getUser();



    if (!user) {

        redirect("/login");

    }



    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", user.id)
        .single();



    if (!profile) {

        redirect("/create-account");

    }



    switch (profile.role) {


        case "resident":

            redirect("/profiles/resident");



        case "school_partner":

            redirect("/profiles/school-partner");



        case "recycler_partner":

            redirect("/profiles/recycler");



        case "lgu_admin":

            redirect("/profiles/lgu");



        default:

            redirect("/login");


    }


}