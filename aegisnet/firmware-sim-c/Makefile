# Makefile for AegisNet ESP32 Firmware Edge-AI Simulator (C99)
CC ?= gcc
CFLAGS ?= -Wall -Wextra -O2 -std=c99
TARGET = edge_ai_sim

all: $(TARGET)

$(TARGET): edge_ai_sim.c
	$(CC) $(CFLAGS) -o $(TARGET) edge_ai_sim.c -lm

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET) $(TARGET).exe
