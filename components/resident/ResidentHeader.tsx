interface ResidentHeaderProps {
  name: string;
  avatar: string | null;
  barangay: string | null;
}



export default function ResidentHeader({
  name,
  avatar,
  barangay,
}: ResidentHeaderProps) {


  const initials = name
    ? name
        .split(" ")
        .map((item) => item.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "TR";


  return (

    <section className="flex items-center justify-between gap-4 rounded-3xl border border-green-100 bg-white p-5 shadow-sm">


      <div className="flex items-center gap-4">


        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-100 to-emerald-200 shadow-inner">


          {
            avatar ?

            <img
              src={avatar}
              alt={`${name} profile`}
              className="h-full w-full object-cover"
            />

            :

            (

              <span className="text-xl font-black text-green-700">
                {initials}
              </span>

            )

          }


        </div>




        <div>


          <p className="text-sm text-zinc-500">
            Welcome back
          </p>


          <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
            {name || "Trashure User"} 👋
          </h1>


          <p className="mt-1 text-sm text-zinc-500">
            {barangay || "Your community"}
          </p>


        </div>


      </div>




      <div className="hidden rounded-2xl bg-green-50 px-4 py-3 text-right sm:block">


        <p className="text-xs font-medium text-green-700">
          Circular Member
        </p>


        <p className="text-sm font-bold text-zinc-800">
          Resident
        </p>


      </div>



    </section>

  );

}