import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(request:NextRequest){
 let response=NextResponse.next({request});
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
  cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}
 });
 const {data:{user}}=await supabase.auth.getUser();
 if(request.nextUrl.pathname.startsWith("/app")&&!user){const url=request.nextUrl.clone();url.pathname="/login";return NextResponse.redirect(url);}
 if(user && !user.email?.toLowerCase().endsWith("@nuvantglobal.com")){await supabase.auth.signOut();const url=request.nextUrl.clone();url.pathname="/login";url.searchParams.set("error","domain");return NextResponse.redirect(url);}
 return response;
}
export const config={matcher:["/app/:path*"]};