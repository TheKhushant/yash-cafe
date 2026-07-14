// import {useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { useUiStore } from "@/stores/ui-store";
// import { Menu } from "lucide-react";

// export function AdminLayout({ children }: { children: ReactNode }) {
//   const [mobileOpen, setMobileOpen] = useState(false);
  
//   return (
//     <div className="min-h-screen flex bg-[#F8F5F0] text-[#1F2937]">
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col min-w-0">
//         <Topbar onMobileMenuClick={() => setMobileOpen(true)} />
        
//         <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#F8F5F0]">
//           <div className="max-w-7xl mx-auto">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

export function AdminLayout({ children }: { children: ReactNode }) {
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

  return (
    <div className="min-h-screen flex bg-[#F8F5F0] text-[#1F2937]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMobileMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#F8F5F0]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}