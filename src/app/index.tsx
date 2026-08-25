import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SQLiteDatabase = SQLite.SQLiteDatabase | null;
interface Note {
  id: number;
  title: string;
  createdAt: string;
}

let db: SQLiteDatabase = null;

//Open or create database

async function initDatabase(): Promise<SQLiteDatabase> {
  try {
    db = await SQLite.openDatabaseAsync("mydb.db");
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
    return db;
  } catch (error) {
    console.log("failed to open or create database");

    return null;
  }
}

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");

  const fetchNotes = async () => {
    if (!db) {
      console.error("Error: DB not found");
      return;
    }
    try {
      const allNotes: Note[] = (await db!.execAsync(
        `SELECT * FROM notes ORDER BY createdAt DESC`,
      )) as any;

      setNotes(allNotes);
    } catch (error) {
      console.error("Error when fetching all data");
    }
  };

  const addNote = async () => {
    if (!db || !title.trim()) return;
    try {
      const now = new Date().toISOString();
      await db.runAsync(`INSERT INTO notes (title, createdAt) VALUES (?,?);`, [
        title.trim(),
        now,
      ]);

      setTitle("");
      fetchNotes();
    } catch (error) {
      console.error("Error : ", error);
    }
  };

  const init = () => {
    setIsLoading(true);
    initDatabase()
      .then(() => {
        console.log("Databases ready");
        fetchNotes();
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notes app</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Write note"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity style={styles.button} onPress={addNote}>
          <Text>Add</Text>
        </TouchableOpacity>
      </View>

      <View>
        {/* Notes List */}
        <FlatList
          data={notes}
          keyExtractor={(item: Note) => item.id.toString()}
          renderItem={({ item }) => {
            return (
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 15,
                  borderRadius: 12,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <>
                  <Text style={{ fontSize: 17, marginBottom: 6 }}>
                    {item.title}
                  </Text>
                </>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 10,
  },
  form: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
    flex: 1,
    marginTop: 4,
    height: "auto",
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c3c3c3",
    borderRadius: 10,
  },
});
