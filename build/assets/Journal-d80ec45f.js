import{an as N,b as r,r as i,c as t,L as E,j as s,B as p,d as c,C as S,T as y,e as h,f as v}from"./index-4b98aa60.js";import{C}from"./Container-1dab81eb.js";import{D as x}from"./DatePicker-94f39176.js";import"./InputAdornment-39d9477e.js";const T=()=>{const d=N(),a=r(e=>e.journalSlice.journalEntry),w=r(e=>e.journalSlice.journalLoading),f=r(e=>e.journalSlice.journalLoaded),g=r(e=>e.authSlice.sidebarFull),D=r(e=>e.authSlice.sidebarVisible),[n,m]=i.useState({journalEntry:a?a.journalEntry:"",date:a?new Date(a.date):new Date}),j=(e,o)=>{m(u=>({...u,[o]:e}))},l=async e=>{const o=new Date(e||new Date);m(u=>({...u,date:o})),d.loadJournalData(o)},b=async e=>{e.preventDefault();const o={journalEntry:n.journalEntry,date:new Date(n.date.setHours(12+new Date().getTimezoneOffset()/-60,0,0,0)).toISOString(),dateCreated:a?a.dateCreated:new Date().toISOString(),dateEdited:new Date().toISOString(),_id:a?a._id:""};d.updateJournalEntry(o)};return i.useEffect(()=>{const e=a?a==null?void 0:a.journalEntry:"";j(e,"journalEntry")},[a]),i.useEffect(()=>{!f&&l(new Date)},[]),t(C,{component:"section",className:`journal ${D?`page-${g?"compact":"full"}`:"page"}`,children:w?t(E,{height:"100%"}):s("form",{className:"journal-form scale-in",onSubmit:b,children:[s(p,{className:"journal-date",children:[s(c,{variant:"outlined",className:"button journal-date-button",onClick:()=>{l(new Date(n.date.getTime()-864e5))},children:[t(S,{className:"journal-date-icon icon-interactive nav-icon"}),t(y,{className:"journal-date-button-text",children:"Prev Day"})]}),t(p,{className:"journal-datepicker-wrapper",children:t(x,{className:"focus journal-datepicker",inputFormat:"dd/MM/yyyy",desktopModeMediaQuery:"@media (min-width:769px)",renderInput:e=>t(h,{size:"small",...e}),value:n.date,onChange:e=>{l(e)}})}),s(c,{variant:"outlined",className:"button journal-date-button",onClick:()=>{l(new Date(n.date.getTime()+864e5))},children:[t(y,{className:"journal-date-button-text",children:"Next Day"}),t(v,{className:"journal-date-icon icon-interactive nav-icon"})]})]}),t(h,{value:n.journalEntry,onChange:e=>{j(e.target.value,"journalEntry")},className:"focus journal-entry input",placeholder:"Write down what is on you mind.",fullWidth:!0,multiline:!0,required:!0,autoFocus:!0}),t(c,{type:"submit",variant:"contained",className:"journal-button button",children:a!=null&&a._id?"Update":"New Entry"})]})})};export{T as default};
