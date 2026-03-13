import { useAuth } from "../hooks/useAuth";

export default function LoginButton() {
    const { login } = useAuth();

    return (
        <button onClick={login}
        className="flex items-center gap-3 px-6 py-3 bg-white
        text-gray-800 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all">
            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
            Continue with Google
        </button>
    );
}
