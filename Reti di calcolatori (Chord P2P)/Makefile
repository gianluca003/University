CC = gcc
CFLAGS = -g
LDFLAGS = -lcrypto -lgmp -lm

TARGET = main
BINDIR = bin
SRCDIR = src
CDIR = c
HEADERDIR = header

all: $(BINDIR) $(BINDIR)/$(TARGET)

# Crea la cartella bin se non esiste
$(BINDIR):
	mkdir -p $(BINDIR)

# Linka l'eseguibile nella cartella bin (main.o è il punto di ingresso)
$(BINDIR)/$(TARGET): $(BINDIR)/main.o $(BINDIR)/chord.o $(BINDIR)/init_chord.o $(BINDIR)/server_chord.o $(BINDIR)/client_chord.o
	$(CC) $(CFLAGS) -o $(BINDIR)/$(TARGET) $(BINDIR)/main.o $(BINDIR)/chord.o $(BINDIR)/init_chord.o $(BINDIR)/server_chord.o $(BINDIR)/client_chord.o $(LDFLAGS)

$(BINDIR)/main.o: src/c/main.c src/header/chord_struct.h
	$(CC) $(CFLAGS) -c src/c/main.c -o $(BINDIR)/main.o

$(BINDIR)/chord.o: src/c/chord.c src/header/init_chord.h src/header/chord_struct.h
	$(CC) $(CFLAGS) -c src/c/chord.c -o $(BINDIR)/chord.o

$(BINDIR)/init_chord.o: src/c/init_chord.c src/header/init_chord.h src/header/chord_struct.h
	$(CC) $(CFLAGS) -c src/c/init_chord.c -o $(BINDIR)/init_chord.o

$(BINDIR)/server_chord.o: src/c/server_chord.c src/header/server_chord.h src/header/chord_struct.h src/header/client_chord.h
	$(CC) $(CFLAGS) -c src/c/server_chord.c -o $(BINDIR)/server_chord.o

$(BINDIR)/client_chord.o: src/c/client_chord.c src/header/client_chord.h src/header/chord_struct.h
	$(CC) $(CFLAGS) -c src/c/client_chord.c -o $(BINDIR)/client_chord.o

clean:
	rm -f $(BINDIR)/*.o $(BINDIR)/$(TARGET)
