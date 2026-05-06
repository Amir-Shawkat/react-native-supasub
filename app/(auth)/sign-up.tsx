import "@/global.css";
import { useAuth, useSignUp } from "@clerk/expo";
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

export default function SignUp() {
    const { signUp, errors, fetchStatus } = useSignUp();
    const signUpFlow = signUp as any;
    const { isSignedIn } = useAuth();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [code, setCode] = useState("");
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const isSubmitting = fetchStatus === "fetching";
    const normalizedEmail = emailAddress.trim().toLowerCase();
    const fieldErrors = (errors?.fields ?? {}) as unknown as Record<string, { message?: string } | undefined>;

    const passwordScore = useMemo(() => {
        return [
            password.length >= 8,
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password),
        ].filter(Boolean).length;
    }, [password]);

    const canSubmit = useMemo(
        () =>
            normalizedEmail.length > 0 &&
            password.length > 0 &&
            confirmPassword.length > 0 &&
            !isSubmitting,
        [normalizedEmail, password, confirmPassword, isSubmitting],
    );

    const completeSignUp = async () => {
        await signUpFlow.finalize({
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

        if (password.length < 8) {
            nextErrors.password = "Use at least 8 characters.";
        }

        if (confirmPassword !== password) {
            nextErrors.confirmPassword = "Passwords must match.";
        }

        setLocalErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        setNotice(null);
        setFormError(null);

        if (!validate()) return;

        try {
            const { error } = await signUpFlow.password({
                emailAddress: normalizedEmail,
                password,
            });

            if (error) {
                setFormError(getErrorMessage(error) ?? "We could not create your account. Try again.");
                return;
            }

            if (
                signUpFlow.status === "missing_requirements" &&
                signUpFlow.unverifiedFields.includes("email_address") &&
                signUpFlow.missingFields.length === 0
            ) {
                await signUpFlow.verifications.sendEmailCode();
                setNotice("We sent a verification code to your email.");
                return;
            }

            if (signUpFlow.status === "complete") {
                await completeSignUp();
                return;
            }

            setFormError("We need a little more information before opening your dashboard.");
        } catch (error) {
            setFormError(getErrorMessage(error) ?? "We could not create your account. Try again.");
        }
    };

    const handleVerify = async () => {
        setFormError(null);

        if (code.trim().length < 4) {
            setLocalErrors({ code: "Enter the code from your email." });
            return;
        }

        try {
            await signUpFlow.verifications.verifyEmailCode({
                code: code.trim(),
            });

            if (signUpFlow.status === "complete") {
                await completeSignUp();
                return;
            }

            setFormError("That code did not finish setup. Request a new one and try again.");
        } catch (error) {
            setFormError(getErrorMessage(error) ?? "That code was not accepted. Try again.");
        }
    };

    if (signUpFlow.status === "complete" || isSignedIn) {
        return null;
    }

    if (
        signUpFlow.status === "missing_requirements" &&
        signUpFlow.unverifiedFields.includes("email_address") &&
        signUpFlow.missingFields.length === 0
    ) {
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
                            <Text className="auth-title">Verify your email</Text>
                            <Text className="auth-subtitle">
                                Confirm your email to protect your subscription dashboard.
                            </Text>
                        </View>

                        <View className="auth-card">
                            <View className="auth-form">
                                {notice && <Text className="auth-success">{notice}</Text>}
                                {formError && <Text className="auth-error">{formError}</Text>}

                                <View className="auth-field">
                                    <Text className="auth-label">Verification code</Text>
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
                                        <Text className="auth-button-text">Finish setup</Text>
                                    )}
                                </Pressable>

                                <Pressable
                                    className="auth-secondary-button"
                                    onPress={() => signUpFlow.verifications.sendEmailCode()}
                                    disabled={isSubmitting}
                                >
                                    <Text className="auth-secondary-button-text">Send a new code</Text>
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
                        <Text className="auth-title">Create your account</Text>
                        <Text className="auth-subtitle">
                            Start tracking renewals with a secure dashboard built for subscriptions.
                        </Text>
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            {formError && <Text className="auth-error">{formError}</Text>}

                            <View className="auth-field">
                                <Text className="auth-label">Email</Text>
                                <TextInput
                                    className={`auth-input ${localErrors.email || fieldErrors.emailAddress ? "auth-input-error" : ""}`}
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
                                {(localErrors.email || fieldErrors.emailAddress?.message) && (
                                    <Text className="auth-error">
                                        {localErrors.email || fieldErrors.emailAddress?.message}
                                    </Text>
                                )}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Password</Text>
                                <TextInput
                                    className={`auth-input ${localErrors.password || fieldErrors.password ? "auth-input-error" : ""}`}
                                    value={password}
                                    placeholder="Create a password"
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    secureTextEntry
                                    onChangeText={(value) => {
                                        setPassword(value);
                                        setLocalErrors((current) => ({ ...current, password: "" }));
                                    }}
                                    textContentType="newPassword"
                                    autoComplete="new-password"
                                />
                                <View className="auth-strength-track">
                                    <View
                                        className="auth-strength-fill"
                                        style={{ width: `${Math.max(passwordScore, 1) * 25}%` }}
                                    />
                                </View>
                                {(localErrors.password || fieldErrors.password?.message) ? (
                                    <Text className="auth-error">
                                        {localErrors.password || fieldErrors.password?.message}
                                    </Text>
                                ) : (
                                    <Text className="auth-helper">
                                        Use 8+ characters. A mix of numbers and symbols is stronger.
                                    </Text>
                                )}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Confirm password</Text>
                                <TextInput
                                    className={`auth-input ${localErrors.confirmPassword ? "auth-input-error" : ""}`}
                                    value={confirmPassword}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    secureTextEntry
                                    onChangeText={(value) => {
                                        setConfirmPassword(value);
                                        setLocalErrors((current) => ({ ...current, confirmPassword: "" }));
                                    }}
                                    textContentType="newPassword"
                                    autoComplete="new-password"
                                />
                                {localErrors.confirmPassword && (
                                    <Text className="auth-error">{localErrors.confirmPassword}</Text>
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
                                    <Text className="auth-button-text">Create account</Text>
                                )}
                            </Pressable>

                            <Text className="auth-helper text-center">
                                Your session is stored securely on this device.
                            </Text>

                            <View nativeID="clerk-captcha" />
                        </View>

                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Already have an account?</Text>
                            <Link href="/(auth)/sign-in">
                                <Text className="auth-link">Sign in</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
