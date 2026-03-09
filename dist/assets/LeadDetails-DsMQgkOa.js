import{c as d,l as h,q as x,r as j,j as e,B as r,n}from"./index-D4N_EHwY.js";import{C as u,a as p,b as v,d as f}from"./card-CpGgPsMV.js";import{L as o}from"./label-DsblYTOw.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=d("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=d("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);function L(){const t=h(),{id:i}=x(),c=!i,[s,l]=j.useState({nombre:"",email:"",telefono:"",notas:""}),m=a=>{a.preventDefault(),t("/leads")};return e.jsxs("div",{className:"container mx-auto p-6",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-6",children:[e.jsxs(r,{variant:"outline",onClick:()=>t("/leads"),children:[e.jsx(b,{className:"mr-2 h-4 w-4"}),"Volver"]}),e.jsx("h1",{className:"text-3xl font-bold",children:c?"Nuevo Lead":"Editar Lead"})]}),e.jsxs(u,{children:[e.jsx(p,{children:e.jsx(v,{children:"Información del Lead"})}),e.jsx(f,{children:e.jsxs("form",{onSubmit:m,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx(o,{children:"Nombre"}),e.jsx(n,{value:s.nombre,onChange:a=>l({...s,nombre:a.target.value}),placeholder:"Nombre completo"})]}),e.jsxs("div",{children:[e.jsx(o,{children:"Email"}),e.jsx(n,{type:"email",value:s.email,onChange:a=>l({...s,email:a.target.value}),placeholder:"correo@ejemplo.com"})]}),e.jsxs("div",{children:[e.jsx(o,{children:"Teléfono"}),e.jsx(n,{value:s.telefono,onChange:a=>l({...s,telefono:a.target.value}),placeholder:"(55) 1234-5678"})]}),e.jsxs("div",{className:"flex gap-2 pt-4",children:[e.jsxs(r,{type:"submit",children:[e.jsx(C,{className:"mr-2 h-4 w-4"}),"Guardar"]}),e.jsx(r,{variant:"outline",onClick:()=>t("/leads"),children:"Cancelar"})]})]})})]})]})}export{L as default};
//# sourceMappingURL=LeadDetails-DsMQgkOa.js.map
