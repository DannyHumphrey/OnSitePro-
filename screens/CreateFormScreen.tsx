import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import type { FormSchema } from "@/components/formRenderer/fields/types";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { RootStackParamList } from "@/navigation/types";
import {
  getFormTemplates,
  type FormTemplate,
} from "@/services/formTemplateService";

export default function CreateFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme() ?? "light";
  const [formName, setFormName] = useState("");
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [formType, setFormType] = useState<string>("");
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getFormTemplates()
      .then((data) => {
        setTemplates(data);
        if (data.length > 0) {
          setFormType(data[0].id);
          setSchema(data[0].schema);
        }
      })
      .catch((err) => console.log("Error loading form templates", err));
  }, []);

  useEffect(() => {
    const template = templates.find((t) => t.id === formType);
    if (template) {
      setSchema(template.schema);
    }
  }, [formType, templates]);

  const handleStart = () => {
    if (!schema) return;
    navigation.navigate("FormScreen", { schema, formType, formName });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldContainer}>
            <ThemedText>Form Name</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Enter form name"
              value={formName}
              onChangeText={setFormName}
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText>Form Type</ThemedText>
            <DropDownPicker
              open={open}
              value={formType}
              items={templates.map((t) => ({ label: t.name, value: t.id }))}
              setOpen={setOpen}
              setValue={(callback) => {
                const val = callback(formType);
                setFormType(val);
              }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>
          <Button
            title="Create"
            onPress={handleStart}
            color={Colors[colorScheme].tint}
            disabled={!schema}
          />
          <Button title="Back" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
});
