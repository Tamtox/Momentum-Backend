import{a7 as L,a as A,a6 as I,b as N,r as f,c as a,B as n,L as P,j as c,d as m,ai as F,T as v,aj as M,e as u}from"./index-4b98aa60.js";import{C as j}from"./Card-e745718f.js";import{T as z}from"./TimePicker-22cedb2b.js";import{F as _,a as E,S as G}from"./Switch-0b4bb37c.js";import{D as Q}from"./DatePicker-94f39176.js";import"./InputAdornment-39d9477e.js";const X=()=>{const k=L(),r=A(),l=I(),T=N(t=>t.todoSlice.todoList),b=N(t=>t.todoSlice.todoLoading),C=k.pathname.split("/")[2],e=T.find(t=>t._id===C),D=f.useRef(null),S=t=>{t.target===D.current&&r("/todo")},p=e!=null&&e.targetTime?e==null?void 0:e.targetTime.split(":"):null,[o,i]=f.useState({todoTitle:(e==null?void 0:e.title)||"",todoDescription:(e==null?void 0:e.description)||"",selectedDate:e!=null&&e.targetDate?new Date(e.targetDate):null,selectedTime:p?new Date(new Date().setHours(Number(p[0]),Number(p[1]))):null,creationUTCOffset:(e==null?void 0:e.creationUTCOffset)||new Date().getTimezoneOffset(),alarmUsed:(e==null?void 0:e.alarmUsed)||!1}),w=(t,s)=>{i(d=>({...d,[s]:t}))},U=()=>{i(t=>({...t,alarmUsed:!t.alarmUsed}))},O=t=>{i(s=>({...s,selectedDate:t}))},y=t=>{i(s=>({...s,selectedTime:t}))},g=(t,s)=>{s==="archive"?l.toggleTodoArchiveStatus(t):l.deleteToDo(t),r("/todo")},x=async t=>{t.preventDefault();const s={title:o.todoTitle,description:o.todoDescription,creationDate:(e==null?void 0:e.creationDate)||new Date().toISOString(),targetDate:o.selectedDate?o.selectedDate.toISOString():null,targetTime:o.selectedDate&&o.selectedTime?new Date(new Date(o.selectedTime).setSeconds(0)).toLocaleTimeString("en-GB"):null,status:(e==null?void 0:e.status)||"Pending",dateCompleted:(e==null?void 0:e.dateCompleted)||null,isArchived:(e==null?void 0:e.isArchived)||!1,creationUTCOffset:o.creationUTCOffset,alarmUsed:o.alarmUsed,_id:(e==null?void 0:e._id)||""};e?l.updateTodo(s,e):l.addTodo(s),r("/todo")};return f.useEffect(()=>{if(e){const{title:t,description:s,targetDate:d,targetTime:h,creationUTCOffset:H,alarmUsed:B}=e;i(R=>({todoTitle:t||"",todoDescription:s||"",selectedDate:d?new Date(d):null,selectedTime:h?new Date(new Date().setHours(Number(h.split(":")[0]),Number(h.split(":")[1]))):null,creationUTCOffset:H||new Date().getTimezoneOffset(),alarmUsed:B||!1}))}},[e]),a(n,{className:"backdrop opacity-transition",ref:D,onClick:t=>S(t),children:b?a(P,{height:"80vh"}):c(j,{component:"form",className:"add-new-todo-form scale-in",onSubmit:x,children:[c(n,{className:"add-new-todo-controls",children:[e?a(n,{className:"archive-todo-wrapper",children:c(m,{className:"archive-todo-button",variant:"outlined",onClick:()=>{g(e,"archive")},children:[a(F,{className:"icon-interactive archive-todo-icon"}),a(v,{className:"archive-todo-text",children:"Archive"})]})}):null,e?a(n,{className:"delete-todo-wrapper",children:c(m,{className:"delete-todo-button",variant:"outlined",onClick:()=>{g(e,"delete")},children:[a(M,{className:"icon-interactive delete-todo-icon"}),a(v,{className:"delete-todo-text",children:"Delete"})]})}):null]}),c(n,{className:"add-new-todo-dates",children:[a(n,{className:"add-new-todo-datepicker-wrapper",children:a(Q,{className:"focus add-new-todo-datepicker",inputFormat:"dd/MM/yyyy",label:"Target Date",desktopModeMediaQuery:"@media (min-width:769px)",renderInput:t=>a(u,{size:"small",...t}),value:o.selectedDate,onChange:t=>{O(t)},closeOnSelect:!0,componentsProps:{actionBar:{actions:["today","clear"]}}})}),o.selectedDate?a(n,{className:"add-new-todo-timepicker-wrapper",children:a(z,{className:"focus add-new-todo-timepicker",inputFormat:"HH:mm",ampm:!1,ampmInClock:!1,label:"Target Time",desktopModeMediaQuery:"@media (min-width:769px)",renderInput:t=>a(u,{size:"small",...t}),value:o.selectedTime,onChange:t=>{y(t)},closeOnSelect:!0,componentsProps:{actionBar:{actions:["clear"]}}})}):null]}),o.selectedDate&&o.selectedTime?a(_,{className:"add-new-todo-alarm-switch",children:a(E,{control:a(G,{checked:o.alarmUsed,onChange:U}),label:"Set todo alarm"})}):null,a(u,{value:o.todoTitle,onChange:t=>{w(t.target.value,"todoTitle")},className:"add-new-todo-title focus input",label:"Title",multiline:!0,required:!0}),a(u,{value:o.todoDescription,onChange:t=>{w(t.target.value,"todoDescription")},label:"Description (Optional) ",className:"add-new-todo-description focus",multiline:!0}),c(n,{className:"add-new-todo-buttons",children:[a(m,{variant:"outlined",className:"button",onClick:()=>{r(-1)},children:"Back"}),a(m,{variant:"outlined",type:"submit",className:"button",children:e?"Update":"Submit"})]})]})})};export{X as default};