@echo off
SET APP_NAME=field-planner

:: 1. Create project with Vite
call npx create-vite@latest %APP_NAME% --template react

cd %APP_NAME%

:: 2. Install Tailwind + deps
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p

:: 3. Overwrite tailwind.config.js
(
echo /** @type {import('tailwindcss').Config} */
echo export default {
echo   content: [
echo     "./index.html",
echo     "./src/**/*.{js,jsx}",
echo   ],
echo   theme: {
echo     extend: {},
echo   },
echo   plugins: [],
echo }
) > tailwind.config.js

:: 4. postcss.config.js
(
echo export default {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo }
) > postcss.config.js

:: 5. index.css
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo body {
echo   font-family: system-ui, sans-serif;
echo }
) > src\index.css

:: 6. App.jsx (planner logic)
(
echo import React, { useState, useEffect } from "react";
echo.
echo const PEOPLE = [
echo   { id: "p1", name: "Kavin", city: "Hyderabad" },
echo   { id: "p2", name: "Arun", city: "Bangalore" },
echo   { id: "p3", name: "Gokul", city: "Coimbatore" },
echo   { id: "p4", name: "Kathir", city: "Chennai" },
echo ];
echo.
echo const CITIES = ["Bangalore", "Chennai", "Hyderabad", "Coimbatore"];
echo const LOCAL_STORAGE_KEY = "field_planner_v2";
echo.
echo function uid() {
echo   return Math.random().toString(36).slice(2, 9);
echo }
echo.
echo export default function FieldPlannerApp() {
echo   const [assignments, setAssignments] = useState(() => {
echo     try {
echo       const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
echo       if (raw) return JSON.parse(raw);
echo     } catch (e) {}
echo     return [];
echo   });
echo.
echo   const [filterDate, setFilterDate] = useState("");
echo   const [newAssignment, setNewAssignment] = useState({ date: todayPlus(0), city: CITIES[0], site: "", personId: PEOPLE[0].id, note: "" });
echo.
echo   useEffect(() => {
echo     try {
echo       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(assignments));
echo     } catch (e) {}
echo   }, [assignments]);
echo.
echo   function addAssignment(payload) {
echo     const person = PEOPLE.find((p) => p.id === payload.personId);
echo     if (person && person.city !== payload.city) {
echo       alert(`${person.name} can only manage sites in ${person.city}`);
echo       return;
echo     }
echo     const perDay = assignments.filter((a) => a.personId === payload.personId && a.date === payload.date);
echo     if (perDay.length ^>^= 3) {
echo       alert(`${person.name} already has 3 sites on ${payload.date}`);
echo       return;
echo     }
echo     setAssignments((s) =^> [{ id: uid(), ...payload }, ...s]);
echo   }
echo.
echo   function removeAssignment(id) {
echo     setAssignments((s) =^> s.filter((a) =^> a.id !== id));
echo   }
echo.
echo   function visibleAssignments() {
echo     return assignments
echo       .filter((a) =^> (filterDate ? a.date === filterDate : true))
echo       .sort((x, y) =^> x.date.localeCompare(y.date) || x.city.localeCompare(y.city));
echo   }
echo.
echo   function freePeople(date) {
echo     return PEOPLE.filter((p) =^> !assignments.some((a) =^> a.date === date && a.personId === p.id));
echo   }
echo.
echo   return (
echo     <div className="p-6 max-w-5xl mx-auto">
echo       <header className="flex items-center justify-between mb-6">
echo         <h1 className="text-2xl font-bold">Field Planner — City Assignments</h1>
echo       </header>
echo.
echo       <section className="grid gap-4 md:grid-cols-3 mb-6">
echo         <div className="col-span-2 bg-white p-4 rounded-xl shadow-sm">
echo           <h2 className="font-semibold mb-2">Add Assignment</h2>
echo           <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
echo             <input type="date" className="p-2 border rounded" value={newAssignment.date} onChange={(e) =^> setNewAssignment((s) =^> ({ ...s, date: e.target.value }))} />
echo             <select className="p-2 border rounded" value={newAssignment.city} onChange={(e) =^> setNewAssignment((s) =^> ({ ...s, city: e.target.value }))}>
echo               {CITIES.map((c) =^> (
echo                 <option key={c} value={c}>{c}</option>
echo               ))}
echo             </select>
echo             <input placeholder="Site name" className="p-2 border rounded" value={newAssignment.site} onChange={(e) =^> setNewAssignment((s) =^> ({ ...s, site: e.target.value }))} />
echo             <select className="p-2 border rounded" value={newAssignment.personId} onChange={(e) =^> setNewAssignment((s) =^> ({ ...s, personId: e.target.value }))}>
echo               {PEOPLE.map((p) =^> <option key={p.id} value={p.id}>{p.name}</option>)}
echo             </select>
echo           </div>
echo           <textarea placeholder="Note (optional)" className="mt-2 p-2 border rounded w-full" value={newAssignment.note} onChange={(e) =^> setNewAssignment((s) =^> ({ ...s, note: e.target.value }))} />
echo           <button className="mt-2 px-3 py-2 rounded bg-indigo-600 text-white" onClick={() =^> addAssignment(newAssignment)}>Add</button>
echo         </div>
echo.
echo         <div className="bg-white p-4 rounded-xl shadow-sm">
echo           <h3 className="font-semibold mb-2">Filter by Date</h3>
echo           <input type="date" className="p-2 border rounded w-full" value={filterDate} onChange={(e) =^> setFilterDate(e.target.value)} />
echo           <button className="mt-2 px-3 py-2 rounded border w-full" onClick={() =^> setFilterDate("")}>Clear</button>
echo         </div>
echo       </section>
echo.
echo       <section className="mb-6">
echo         <h2 className="text-lg font-semibold mb-2">Assignments</h2>
echo         <div className="overflow-auto bg-white rounded-xl shadow-sm">
echo           <table className="min-w-full table-auto">
echo             <thead className="bg-gray-50 text-left">
echo               <tr>
echo                 <th className="p-3">Date</th>
echo                 <th className="p-3">City</th>
echo                 <th className="p-3">Site</th>
echo                 <th className="p-3">Person</th>
echo                 <th className="p-3">Note</th>
echo                 <th className="p-3">Actions</th>
echo               </tr>
echo             </thead>
echo             <tbody>
echo               {visibleAssignments().map((a) =^> (
echo                 <tr key={a.id}>
echo                   <td className="p-3">{a.date}</td>
echo                   <td className="p-3">{a.city}</td>
echo                   <td className="p-3">{a.site}</td>
echo                   <td className="p-3">{(PEOPLE.find((p) =^> p.id === a.personId) || {}).name}</td>
echo                   <td className="p-3">{a.note}</td>
echo                   <td className="p-3">
echo                     <button className="px-2 py-1 border rounded text-sm" onClick={() =^> removeAssignment(a.id)}>Delete</button>
echo                   </td>
echo                 </tr>
echo               ))}
echo               {visibleAssignments().length === 0 && (
echo                 <tr><td colSpan={6} className="p-6 text-center text-gray-500">No assignments found</td></tr>
echo               )}
echo             </tbody>
echo           </table>
echo         </div>
echo       </section>
echo.
echo       {filterDate && (
echo         <section className="bg-white p-4 rounded-xl shadow-sm">
echo           <h2 className="font-semibold mb-2">Free People on {filterDate}</h2>
echo           <ul className="list-disc pl-6">
echo             {freePeople(filterDate).map((p) =^> (
echo               <li key={p.id}>{p.name} ({p.city})</li>
echo             ))}
echo             {freePeople(filterDate).length === 0 && <li>None</li>}
echo           </ul>
echo         </section>
echo       )}
echo     </div>
echo   );
echo }
echo.
echo function todayPlus(offset) {
echo   const d = new Date();
echo   d.setDate(d.getDate() + offset);
echo   return d.toISOString().slice(0, 10);
echo }
) > src\App.jsx

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo cd %APP_NAME%
echo npm install
echo npm run dev
pause
