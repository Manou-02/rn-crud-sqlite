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

  //  Edit Mode States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const fetchNotes = async () => {
    if (!db) {
      console.error("Error: DB not found");
      return;
    }
    try {
      const allNotes: Note[] = await db!.getAllAsync(
        `SELECT * FROM notes ORDER BY id DESC;`,
      );

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

  const deleteNote = async (id: number) => {
    if (!db) return;

    try {
      await db.runAsync("DELETE FROM notes WHERE id = ?;", [id]);
      fetchNotes();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const updateNote = async () => {
    if (!db || editingId === null || !editingText.trim()) return;

    try {
      await db.runAsync("UPDATE notes SET title = ? WHERE id = ?;", [
        editingText.trim(),
        editingId,
      ]);

      setEditingId(null);
      setEditingText("");
      fetchNotes();
    } catch (error) {
      console.error("Update error:", error);
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
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
            const isEditing = editingId === item.id;

            return (
              <View style={styles.card}>
                <>
                  {isEditing ? (
                    <>
                      <TextInput
                        value={editingText}
                        onChangeText={setEditingText}
                        style={{
                          borderWidth: 1,
                          borderColor: "#aaa",
                          padding: 10,
                          borderRadius: 8,
                          marginBottom: 10,
                          flex: 1,
                        }}
                      />

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                          onPress={updateNote}
                          style={{
                            backgroundColor: "#27AE60",
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: "white", fontWeight: "600" }}>
                            Save
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                          style={{
                            backgroundColor: "#999",
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: "white", fontWeight: "600" }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.cardContent}>
                        <Text style={{ fontSize: 17, marginBottom: 6 }}>
                          {item.title}
                        </Text>
                        <Text
                          style={{
                            color: "#777",
                            fontSize: 13,
                            marginBottom: 10,
                          }}
                        >
                          🕒 {formatDate(item.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.action}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingId(item.id);
                            setEditingText(item.title);
                          }}
                          style={styles.edit}
                        >
                          <Text style={{ color: "black", fontWeight: "600" }}>
                            Edit
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => deleteNote(item.id)}
                          style={styles.delete}
                        >
                          <Text style={{ color: "white", fontWeight: "600" }}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
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
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    flexDirection: "row",
  },
  cardContent: { flex: 1 },
  action: {
    flexDirection: "row",
    gap: 10,
  },
  edit: {
    backgroundColor: "#F1C40F",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  delete: {
    backgroundColor: "#FF5252",
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
});
