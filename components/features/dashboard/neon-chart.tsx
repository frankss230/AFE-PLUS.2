// "use client";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Filler,
//   Legend,
//   ScriptableContext,
// } from "chart.js";
// import { Line } from "react-chartjs-2";

// // ลงทะเบียน Chart.js
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Filler,
//   Legend
// );

// export default function NeonChart() {
  
//   // ✅ วิธีแก้: ไม่ใช้ useState/useEffect สร้าง Gradient แล้ว (ลดการ Re-render Loop)
//   // แต่ใช้ฟังก์ชันของ Chart.js สร้างสีตอน Runtime แทน
  
//   const data = {
//     labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
//     datasets: [
//       {
//         label: "Real-time Signals",
//         data: [30, 55, 40, 75, 60, 90, 85],
//         borderColor: "#00f2ff",
//         // ✅ ใช้ฟังก์ชันสร้าง Gradient แบบปลอดภัย
//         backgroundColor: (context: ScriptableContext<"line">) => {
//           const ctx = context.chart.ctx;
//           const gradient = ctx.createLinearGradient(0, 0, 0, 400);
//           gradient.addColorStop(0, "rgba(0, 242, 255, 0.5)");
//           gradient.addColorStop(1, "rgba(0, 242, 255, 0.0)");
//           return gradient;
//         },
//         fill: true,
//         tension: 0.4,
//         borderWidth: 3,
//         pointBackgroundColor: "#fff",
//         pointBorderColor: "#00f2ff",
//         pointRadius: 4,
//         pointHoverRadius: 8,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         backgroundColor: "rgba(10, 14, 26, 0.9)",
//         titleColor: "#00f2ff",
//         bodyColor: "#fff",
//         borderColor: "#00f2ff",
//         borderWidth: 1,
//       },
//     },
//     scales: {
//       x: {
//         grid: { color: "rgba(255, 255, 255, 0.05)" },
//         ticks: { color: "#64748b" },
//       },
//       y: {
//         grid: { color: "rgba(255, 255, 255, 0.05)" },
//         ticks: { color: "#64748b" },
//       },
//     },
//     // ✅ เอา Animation Loop ออก (ตัวการกิน CPU)
//     animation: {
//         duration: 1500, // เล่นแค่ครั้งเดียวตอนโหลดพอครับ
//         easing: 'easeOutQuart' as const
//     }
//   };

//   return (
//     <div className="w-full h-full p-4 bg-[#111827] rounded-3xl border border-cyan-500/20 shadow-[0_0_15px_rgba(0,242,255,0.1)] relative overflow-hidden group">
//       {/* Background Effect */}
//       <div className="absolute inset-0 border-2 border-transparent rounded-3xl group-hover:border-cyan-500/30 transition-all duration-500 pointer-events-none" />
      
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
//           <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
//           Live Signal Monitor
//         </h3>
//         <span className="text-xs text-slate-500 font-mono">SYSTEM ONLINE</span>
//       </div>
      
//       <div className="h-[calc(100%-2rem)] w-full">
//         {/* @ts-ignore */}
//         <Line data={data} options={options as any} />
//       </div>
//     </div>
//   );
// }