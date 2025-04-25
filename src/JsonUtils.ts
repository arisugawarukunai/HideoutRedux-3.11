import { jsonc } from 'jsonc';

export function Deserialize<T>(path:string) : T{
    let err:Error;
    let obj:T;

    [err, obj] = jsonc.safe.readSync(path) as [Error, T];
    
    if (!!err) {throw err}

    return obj;
}