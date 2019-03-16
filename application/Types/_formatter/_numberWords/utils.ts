/// <amd-module name="Types/_formatter/_numberWords/utils" />

export function iterateNumber(numAsStr: string, callBack: Function): void {
   let counter = 0;
   const threes = [];
   while (numAsStr.length > 0) {
      const three = numAsStr.substr(Math.max(numAsStr.length - 3, 0), 3);
      if (three.length !== 0) {
         // @ts-ignore
         threes.unshift([three.padStart(3, '0'), counter++]);
      }
      numAsStr = numAsStr.slice(0, -3);
   }
   threes.forEach((args) => {
      callBack.call(this, ...args);
   });
}
