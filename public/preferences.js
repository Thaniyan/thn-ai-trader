/* Nonfinancial preferences only. Never a ledger or recovery store. */
window.THNPreferences = (() => {
 let refused=false;
 function warn(){refused=true;window.dispatchEvent(new Event('thn:storage-unavailable'));}
 return {getItem(key){try{return localStorage.getItem(key);}catch{warn();return null;}},
 setItem(key,value){try{localStorage.setItem(key,value);return true;}catch{warn();return false;}},
 removeItem(key){try{localStorage.removeItem(key);return true;}catch{warn();return false;}},unavailable:()=>refused};
})();
