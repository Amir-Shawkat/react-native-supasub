import { icons } from "@/constants/icons";
import { getSubscriptionIconName } from "@/constants/subscriptionIcons";
import clsx from "clsx";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

type Frequency = "Monthly" | "Yearly";

interface CreateSubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (subscription: Subscription) => void;
}

const categories = [
    "Entertainment",
    "AI Tools",
    "Developer Tools",
    "Design",
    "Productivity",
    "Cloud",
    "Music",
    "Other",
];

const categoryColors: Record<string, string> = {
    Entertainment: "#f7b7a3",
    "AI Tools": "#b8d4e3",
    "Developer Tools": "#e8def8",
    Design: "#f5c542",
    Productivity: "#b8e8d0",
    Cloud: "#a8d8f0",
    Music: "#c8e6c9",
    Other: "#f0d8a8",
};

const initialFrequency: Frequency = "Monthly";
const initialCategory = "Entertainment";

const CreateSubscriptionModal = ({ visible, onClose, onCreate }: CreateSubscriptionModalProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<Frequency>(initialFrequency);
    const [category, setCategory] = useState(initialCategory);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const parsedPrice = Number.parseFloat(price);
    const canSubmit = useMemo(
        () => name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0,
        [name, parsedPrice],
    );

    const resetForm = () => {
        setName("");
        setPrice("");
        setFrequency(initialFrequency);
        setCategory(initialCategory);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validate = () => {
        const nextErrors: Record<string, string> = {};

        if (!name.trim()) {
            nextErrors.name = "Enter a subscription name.";
        }

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            nextErrors.price = "Enter a positive price.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const startDate = dayjs();
        const renewalDate = startDate.add(frequency === "Monthly" ? 1 : 1, frequency === "Monthly" ? "month" : "year");

        onCreate({
            id: `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
            name: name.trim(),
            price: parsedPrice,
            frequency,
            category,
            status: "active",
            startDate: startDate.toISOString(),
            renewalDate: renewalDate.toISOString(),
            icon: icons.wallet,
            iconName: getSubscriptionIconName(name, category),
            billing: frequency,
            currency: "USD",
            color: categoryColors[category] ?? categoryColors.Other,
        });

        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable className="modal-overlay" onPress={handleClose}>
                    <Pressable className="modal-container" onPress={(e) => e.stopPropagation()}>
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose}>
                                <Text className="modal-close-text">✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            contentContainerClassName="modal-body"
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className={clsx("auth-input", errors.name && "auth-input-error")}
                                    value={name}
                                    placeholder="Netflix, GitHub, OpenAI..."
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    autoCapitalize="words"
                                    onChangeText={(value) => {
                                        setName(value);
                                        setErrors((current) => ({ ...current, name: "" }));
                                    }}
                                />
                                {errors.name && <Text className="auth-error">{errors.name}</Text>}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className={clsx("auth-input", errors.price && "auth-input-error")}
                                    value={price}
                                    placeholder="19.99"
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    keyboardType="decimal-pad"
                                    onChangeText={(value) => {
                                        setPrice(value);
                                        setErrors((current) => ({ ...current, price: "" }));
                                    }}
                                />
                                {errors.price && <Text className="auth-error">{errors.price}</Text>}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    {(["Monthly", "Yearly"] as Frequency[]).map((option) => {
                                        const isActive = frequency === option;

                                        return (
                                            <Pressable
                                                key={option}
                                                className={clsx("picker-option", isActive && "picker-option-active")}
                                                onPress={() => setFrequency(option)}
                                            >
                                                <Text
                                                    className={clsx(
                                                        "picker-option-text",
                                                        isActive && "picker-option-text-active",
                                                    )}
                                                >
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {categories.map((option) => {
                                        const isActive = category === option;

                                        return (
                                            <Pressable
                                                key={option}
                                                className={clsx("category-chip", isActive && "category-chip-active")}
                                                onPress={() => setCategory(option)}
                                            >
                                                <Text
                                                    className={clsx(
                                                        "category-chip-text",
                                                        isActive && "category-chip-text-active",
                                                    )}
                                                >
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <Pressable
                                className={clsx("auth-button", !canSubmit && "auth-button-disabled")}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                            >
                                <Text className="auth-button-text">Create subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;
