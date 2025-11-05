export async function customFetch(input: string | URL | Request, init?: RequestInit | undefined):Promise<Response>{
    try {
        const fetch_actual = await fetch(input,init??undefined);
        return fetch_actual;       
    } catch (error) {
        try {
            const custom_endpoint = "http://localhost:8000/api/make_call" + (init == undefined ? "_get" : init.method);
            const custom_fetch = await fetch(custom_endpoint,{
                method:"POST",
                headers: {
                    "Content-Type": "application/json", // ❗ missing in your code
                },
                body:JSON.stringify({
                    url:input,
                    headers:init?.headers??undefined,
                    body:init?.body??undefined,
                })
            });
            return custom_fetch;
        } catch (error) {
            throw new Error();
        }
    }
}