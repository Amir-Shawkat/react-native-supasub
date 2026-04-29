import "@/global.css";
import { useSignIn } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown) => {
    if (
        typeof error === "object" &&
        error !== null &&
        "errors" in error &&
        Array.isArray((error as { errors?: unknown }).errors)
    ) {
        const [firstError] = (error as { errors: { longMessage?: string; message?: string }[] }).errors;
        return firstError?.longMessage ?? firstError?.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return undefined;
};

export default function SignIn() {
    const { signIn, errors, fetchStatus } = useSignIn();
    const signInFlow = signIn as any;
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const isSubmitting = fetchStatus === "fetching";
    const normalizedEmail = emailAddress.trim().toLowerCase();
    const fieldErrors = (errors?.fields ?? {}) as unknown as Record<string, { message?: string } | undefined>;

    const canSubmit = useMemo(
        () => normalizedEmail.length > 0 && password.length > 0 && !isSubmitting,
        [normalizedEmail, password, isSubmitting],
    );

    const completeSignIn = async () => {
        await signInFlow.finalize({
            navigate: ({ session }: { session?: { currentTask?: unknown } }) => {
                if (session?.currentTask) {
                    setFormError("Your account needs one more security step before you can continue.");
                    return;
                }

                router.replace("/" as Href);
            },
        });
    };

    const validate = () => {
        const nextErrors: Record<string, string> = {};

        if (!emailPattern.test(normalizedEmail)) {
            nextErrors.email = "Enter a valid email address.";
        }

        if (!password) {
            nextErrors.password = "Enter your password.";
        }

        setLocalErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        setNotice(null);
        setFormError(null);

        if (!validate()) return;

        try {
            const { error } = await signInFlow.password({
                emailAddress: normalizedEmail,
                password,
            });

            if (error) {
                setFormError(getErrorMessage(error) ?? "We could not sign you in. Check your details and try again.");
                return;
            }

            if (signInFlow.status === "complete") {
                await completeSignIn();
                return;
            }

            if (signInFlow.status === "needs_client_trust") {
                const emailCodeFactor = signInFlow.supportedSecondFactors.find(
                    (factor: { strategy?: string }) => factor.strategy === "email_code",
                );

                if (emailCodeFactor) {
                    await signInFlow.mfa.sendEmailCode();
                    setNotice("We sent a security code to your email.");
                    return;
                }
            }

            if (signInFlow.status === "needs_second_factor") {
                setFormError("Use your second factor to finish signing in.");
                return;
            }

            setFormError("We need a little more information before opening your dashboard.");
        } catch (error) {
            setFormError(getErrorMessage(error) ?? "We could not sign you in. Check your details and try again.");
        }
    };

    const handleVerify = async () => {
        setFormError(null);

        if (code.trim().length < 4) {
            setLocalErrors({ code: "Enter the code from your email." });
            return;
        }

        try {
            await signInFlow.mfa.verifyEmailCode({ code: code.trim() });

            if (signInFlow.status === "complete") {
                await completeSignIn();
                return;
            }

            setFormError("That code did not finish the sign in. Request a new one and try again.");
        } catch (error) {
            setFormError(getErrorMessage(error) ?? "That code was not accepted. Try again.");
        }
    };

    if (signInFlow.status === "needs_client_trust") {
        return (
            <SafeAreaView className="auth-safe-area">
                <KeyboardAvoidingView
                    className="auth-screen"
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        className="auth-scroll"
                        contentContainerClassName="auth-content justify-center"
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="auth-brand-block">
                            <View className="auth-logo-wrap">
                                <View className="auth-logo-mark">
                                    <Text className="auth-logo-mark-text">S</Text>
                                </View>
                                <View>
                                    <Text className="auth-wordmark">SubGuide</Text>
                                    <Text className="auth-wordmark-sub">Smart billing</Text>
                                </View>
                            </View>
                            <Text className="auth-title">Check your email</Text>
                            <Text className="auth-subtitle">
                                Enter the security code we sent so your subscription data stays protected.
                            </Text>
                        </View>

                        <View className="auth-card">
                            <View className="auth-form">
                                {notice && <Text className="auth-success">{notice}</Text>}
                                {formError && <Text className="auth-error">{formError}</Text>}

                                <View className="auth-field">
                                    <Text className="auth-label">Security code</Text>
                                    <TextInput
                                        className={`auth-input ${localErrors.code || fieldErrors.code ? "auth-input-error" : ""}`}
                                        value={code}
                                        placeholder="Enter your code"
                                        placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                        onChangeText={(value) => {
                                            setCode(value);
                                            setLocalErrors((current) => ({ ...current, code: "" }));
                                        }}
                                        keyboardType="number-pad"
                                        textContentType="oneTimeCode"
                                        autoComplete="sms-otp"
                                    />
                                    {(localErrors.code || fieldErrors.code?.message) && (
                                        <Text className="auth-error">
                                            {localErrors.code || fieldErrors.code?.message}
                                        </Text>
                                    )}
                                </View>

                                <Pressable
                                    className={`auth-button ${isSubmitting ? "auth-button-disabled" : ""}`}
                                    onPress={handleVerify}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#081126" />
                                    ) : (
                                        <Text className="auth-button-text">Verify code</Text>
                                    )}
                                </Pressable>

                                <Pressable
                                    className="auth-secondary-button"
                                    onPress={() => signInFlow.mfa.sendEmailCode()}
                                    disabled={isSubmitting}
                                >
                                    <Text className="auth-secondary-button-text">Send a new code</Text>
                                </Pressable>

                                <Pressable
                                    className="auth-quiet-button"
                                    onPress={() => {
                                        setCode("");
                                        setNotice(null);
                                        signInFlow.reset();
                                    }}
                                >
                                    <Text className="auth-quiet-button-text">Use another account</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                className="auth-screen"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    className="auth-scroll"
                    contentContainerClassName="auth-content justify-center"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="auth-brand-block">
                        <View className="auth-logo-wrap">
                            <View className="auth-logo-mark">
                                <Text className="auth-logo-mark-text">S</Text>
                            </View>
                            <View>
                                <Text className="auth-wordmark">SubGuide</Text>
                                <Text className="auth-wordmark-sub">Smart billing</Text>
                            </View>
                        </View>
                        <Text className="auth-title">Welcome back</Text>
                        <Text className="auth-subtitle">Sign in to continue managing every renewal in one place.</Text>
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            {formError && <Text className="auth-error">{formError}</Text>}

                            <View className="auth-field">
                                <Text className="auth-label">Email</Text>
                                <TextInput
                                    className={`auth-input ${localErrors.email || fieldErrors.identifier ? "auth-input-error" : ""}`}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={emailAddress}
                                    placeholder="Enter your email"
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    onChangeText={(value) => {
                                        setEmailAddress(value);
                                        setLocalErrors((current) => ({ ...current, email: "" }));
                                    }}
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                />
                                {(localErrors.email || fieldErrors.identifier?.message) && (
                                    <Text className="auth-error">
                                        {localErrors.email || fieldErrors.identifier?.message}
                                    </Text>
                                )}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Password</Text>
                                <TextInput
                                    className={`auth-input ${localErrors.password || fieldErrors.password ? "auth-input-error" : ""}`}
                                    value={password}
                                    placeholder="Enter your password"
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    secureTextEntry
                                    onChangeText={(value) => {
                                        setPassword(value);
                                        setLocalErrors((current) => ({ ...current, password: "" }));
                                    }}
                                    textContentType="password"
                                    autoComplete="password"
                                />
                                {(localErrors.password || fieldErrors.password?.message) && (
                                    <Text className="auth-error">
                                        {localErrors.password || fieldErrors.password?.message}
                                    </Text>
                                )}
                            </View>

                            <Pressable
                                className={`auth-button ${!canSubmit ? "auth-button-disabled" : ""}`}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#081126" />
                                ) : (
                                    <Text className="auth-button-text">Sign in</Text>
                                )}
                            </Pressable>

                            <View className="auth-trust-row">
                                <Text className="auth-trust-copy">Encrypted sessions</Text>
                                <Text className="auth-trust-dot">•</Text>
                                <Text className="auth-trust-copy">Private billing data</Text>
                            </View>
                        </View>

                        <View className="auth-link-row">
                            <Text className="auth-link-copy">New to SubGuide?</Text>
                            <Link href="/(auth)/sign-up">
                                <Text className="auth-link">Create an account</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
