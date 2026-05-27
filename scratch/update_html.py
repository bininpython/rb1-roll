import sys
import os
import re

def update_html():
    file_path = r"c:\Users\Usuario\Desktop\forno\index.html"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract modals
    modal_start = content.find("<!-- Modal: Substituição -->")
    if modal_start == -1:
        print("Could not find modals")
        return
        
    modals = content[modal_start:]
    
    new_html = """<!DOCTYPE html>
<html lang="pt-BR" style="">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>RB1 System - Aperam</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&amp;family=Open+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "on-surface": "#191c1d",
                        "outline-variant": "#cec3d3",
                        "surface-bright": "#f8f9fa",
                        "surface-container-high": "#e7e8e9",
                        "primary-fixed-dim": "#ddb7ff",
                        "on-primary": "#ffffff",
                        "primary": "#2e0052",
                        "secondary-container": "#fd8b00",
                        "surface-tint": "#7b41b3",
                        "on-secondary": "#ffffff",
                        "on-error-container": "#93000a",
                        "surface-variant": "#e1e3e4",
                        "tertiary-fixed-dim": "#fbb884",
                        "tertiary-container": "#4f2700",
                        "surface-container-highest": "#e1e3e4",
                        "on-tertiary-fixed-variant": "#693c12",
                        "on-tertiary-container": "#c98c5c",
                        "surface": "#f8f9fa",
                        "primary-fixed": "#f0dbff",
                        "on-primary-fixed": "#2c0050",
                        "on-primary-fixed-variant": "#622599",
                        "surface-container-low": "#f3f4f5",
                        "on-tertiary-fixed": "#2f1500",
                        "inverse-surface": "#2e3132",
                        "error-container": "#ffdad6",
                        "inverse-on-surface": "#f0f1f2",
                        "surface-container-lowest": "#ffffff",
                        "background": "#f8f9fa",
                        "on-secondary-fixed-variant": "#6e3900",
                        "on-tertiary": "#ffffff",
                        "on-secondary-fixed": "#2f1500",
                        "surface-container": "#edeeef",
                        "primary-container": "#4b0082",
                        "tertiary-fixed": "#ffdcc3",
                        "outline": "#7d7483",
                        "on-surface-variant": "#4c4451",
                        "secondary-fixed": "#ffdcc3",
                        "on-primary-container": "#ba7ef4",
                        "on-error": "#ffffff",
                        "secondary-fixed-dim": "#ffb77d",
                        "on-background": "#191c1d",
                        "inverse-primary": "#ddb7ff",
                        "on-secondary-container": "#603100",
                        "secondary": "#904d00",
                        "tertiary": "#301600",
                        "surface-dim": "#d9dadb",
                        "error": "#ba1a1a"
                    },
                    borderRadius: {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    spacing: {
                        "xs": "4px",
                        "lg": "24px",
                        "unit": "4px",
                        "md": "16px",
                        "container-margin": "24px",
                        "gutter": "16px",
                        "sm": "8px",
                        "xl": "32px"
                    },
                    fontFamily: {
                        "headline-lg-mobile": ["Montserrat"],
                        "display": ["Montserrat"],
                        "headline-md": ["Montserrat"],
                        "body-lg": ["Open Sans"],
                        "body-md": ["Open Sans"],
                        "label-bold": ["Open Sans"],
                        "headline-lg": ["Montserrat"],
                        "label-sm": ["Open Sans"]
                    },
                    fontSize: {
                        "headline-lg-mobile": ["20px", { lineHeight: "28px", fontWeight: "600" }],
                        "display": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
                        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
                        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
                        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
                        "label-bold": ["12px", { lineHeight: "16px", fontWeight: "700" }],
                        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "600" }],
                        "label-sm": ["11px", { lineHeight: "14px", fontWeight: "600" }]
                    }
                }
            }
        }
    </script>
    <style>
        .aperam-gradient {
            background: linear-gradient(90deg, #4b0082 0%, #ff8c00 100%);
        }
        .text-gradient {
            background: linear-gradient(90deg, #4b0082 0%, #ff8c00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .btn-outline-purple {
            border: 1.5px solid #4B0082;
            color: #4B0082;
        }
        .btn-outline-orange {
            border: 1.5px solid #FF8C00;
            color: #FF8C00;
        }
        
        /* Bridge active state for tabs */
        #tabForno.active, #tabDecapagem.active {
            border-bottom-color: white !important;
            color: white !important;
        }
        #tabForno:not(.active), #tabDecapagem:not(.active) {
            border-bottom-color: transparent !important;
            color: rgba(255, 255, 255, 0.7) !important;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col">
    <header id="app-header" class="aperam-gradient border-b border-white/20 docked full-width top-0 z-50">
        <div class="h-1 w-full bg-white/20"></div>
        <div class="flex justify-between items-center w-full px-lg py-sm max-w-[1440px] mx-auto flex-wrap gap-4">
            <div class="flex items-center gap-3">
                <div>
                    <h1 class="text-headline-lg font-headline-lg font-bold text-white">RB1 System</h1>
                    <p class="text-label-sm font-label-sm text-white/80 uppercase tracking-wider">LINHA DE RECOZIMENTO · APERAM</p>
                </div>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded border border-white/10">
                    <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span class="text-label-bold font-label-bold text-white">SYS ONLINE</span>
                </div>
                <div id="liveClock" class="bg-black/20 px-3 py-1.5 rounded border border-white/10 text-label-bold font-label-bold text-white"></div>
                <button id="btnAddEstRetifica" class="border border-white text-white px-4 py-1.5 rounded text-label-bold font-label-bold transition-colors hover:bg-white/10">+ Estoque Retífica</button>
                <button id="btnAddEstRb1" class="border border-white text-white px-4 py-1.5 rounded text-label-bold font-label-bold transition-colors hover:bg-white/10">+ Estoque RB1</button>
                <button id="btnNovaSub" class="bg-white text-primary px-4 py-1.5 rounded text-label-bold font-label-bold hover:bg-white/90 transition-colors shadow-sm">+ Nova Substituição</button>
            </div>
        </div>
        <div class="max-w-[1440px] mx-auto px-lg">
            <nav class="flex gap-6 mt-2">
                <a id="tabForno" class="text-white/70 font-label-bold text-label-bold flex items-center gap-2 pb-2 hover:text-white transition-colors border-b-2 border-transparent cursor-pointer active">
                    <span class="material-symbols-outlined text-sm" data-icon="local_fire_department">local_fire_department</span>
                    Forno de Recozimento
                </a>
                <a id="tabDecapagem" class="font-label-bold text-label-bold flex items-center gap-2 pb-2 border-b-2 border-white text-white cursor-pointer">
                    <span class="material-symbols-outlined text-sm" data-icon="bolt">bolt</span>
                    Decapagem
                </a>
            </nav>
        </div>
    </header>

    <main id="app-main" class="flex-1 max-w-[1440px] mx-auto w-full px-lg py-lg grid grid-cols-1 gap-lg">
        
        <!-- FORNO VIEW -->
        <div id="viewForno" class="view-active w-full">
            <section id="statsBar" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-lg"></section>
            
            <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden mb-lg">
                <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                    <h2 class="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary" data-icon="local_fire_department">local_fire_department</span>
                        Forno de Recozimento — Visão em Corte
                    </h2>
                    <div class="text-secondary font-label-bold text-label-bold flex items-center gap-1">
                        <div class="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></div>
                        AO VIVO
                    </div>
                </div>
                <div class="bg-on-surface p-lg relative min-h-[400px] flex flex-col items-center justify-center overflow-x-auto">
                    <div id="furnaceDiagram" class="w-full"></div>
                    <div id="rollCards" class="roll-cards mt-4" style="display:flex;gap:1rem;color:white;overflow-x:auto;width:100%;"></div>
                </div>
            </section>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
                <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
                    <div class="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                        <h3 class="text-body-lg font-body-lg font-bold text-on-surface">📦 Estoque de Rolos</h3>
                        <div class="flex gap-2 text-label-sm">
                            <button id="toggleRetifica" class="active bg-surface-container-low px-2 py-1 rounded">Retífica <span id="countRetifica">0</span></button>
                            <button id="toggleRb1" class="px-2 py-1 rounded">RB1 <span id="countRb1">0</span></button>
                        </div>
                    </div>
                    <div class="p-4" style="min-height:200px;">
                        <div id="inventoryList" class="flex flex-col gap-2"></div>
                        <div id="inventoryEmpty" class="text-center text-outline-variant p-4">Nenhum rolo nesta categoria</div>
                    </div>
                </section>
                
                <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
                    <div class="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                        <h3 class="text-body-lg font-body-lg font-bold text-on-surface">📋 Histórico</h3>
                        <div class="flex gap-2">
                            <select id="filterPos" class="border rounded p-1 text-label-sm"><option value="">Todas Posições</option></select>
                            <select id="filterTurno" class="border rounded p-1 text-label-sm"><option value="">Todos Turnos</option></select>
                        </div>
                    </div>
                    <div class="overflow-x-auto" style="min-height:200px;">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-surface-container-low text-label-bold font-label-bold text-on-surface-variant uppercase">
                                <tr><th>Data</th><th>Posição</th><th>Turno</th><th>Diam</th><th>Idade</th><th>Ações</th></tr>
                            </thead>
                            <tbody id="histBody" class="text-body-md font-body-md"></tbody>
                        </table>
                        <div id="histEmpty" class="text-center text-outline-variant p-4">Nenhum registro</div>
                    </div>
                </section>
            </div>
            
            <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
                <div class="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                    <h3 class="text-body-lg font-body-lg font-bold text-on-surface">📅 Trocas por Mês</h3>
                    <div class="flex items-center gap-2">
                        <button id="prevYear" class="px-2">◀</button>
                        <span id="yearLabel" class="font-bold"></span>
                        <button id="nextYear" class="px-2">▶</button>
                    </div>
                </div>
                <div class="p-4">
                    <div id="monthTabs" class="flex gap-2 mb-4 overflow-x-auto"></div>
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-surface-container-low text-label-bold font-label-bold text-on-surface-variant uppercase">
                            <tr><th>Data</th><th>Posição</th><th>Turno</th><th>Diam</th><th>Motivo</th><th>Idade</th></tr>
                        </thead>
                        <tbody id="monthBody" class="text-body-md font-body-md"></tbody>
                    </table>
                    <div id="monthEmpty" class="text-center text-outline-variant p-4">Nenhuma troca neste mês</div>
                    <div id="monthSummary" class="mt-4"></div>
                </div>
            </section>
        </div>

        <!-- DECAPAGEM VIEW -->
        <div id="viewDecapagem" class="view-hidden w-full">
            <section id="statsDecapagemBar" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-lg"></section>
            
            <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden mb-lg">
                <div class="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                    <h2 class="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary" data-icon="bolt">bolt</span>
                        Decapagem Química e Eletrolítica
                    </h2>
                    <div class="text-secondary font-label-bold text-label-bold flex items-center gap-1">
                        <div class="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></div>
                        AO VIVO
                    </div>
                </div>
                <div class="bg-on-surface p-0 relative min-h-[400px] flex items-center justify-center overflow-x-auto">
                    <div id="decapagemDiagram" class="w-full relative flex items-center justify-center"></div>
                </div>
            </section>
            
            <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden mb-lg">
                <div class="p-4 border-b border-outline-variant bg-surface-bright">
                    <h3 class="text-body-lg font-body-lg font-bold text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-outline" data-icon="list_alt">list_alt</span>
                        Status e Identificação dos Rolos e Escovas (Decapagem)
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-surface-container-low text-label-bold font-label-bold text-on-surface-variant uppercase">
                            <tr>
                                <th class="p-4 border-b border-outline-variant">Posição / Nome</th>
                                <th class="p-4 border-b border-outline-variant">Tipo</th>
                                <th class="p-4 border-b border-outline-variant">Diâmetro</th>
                                <th class="p-4 border-b border-outline-variant">Perímetro</th>
                                <th class="p-4 border-b border-outline-variant">Instalação</th>
                                <th class="p-4 border-b border-outline-variant">Turno</th>
                                <th class="p-4 border-b border-outline-variant">Tempo Ativo</th>
                                <th class="p-4 border-b border-outline-variant">Motivo / Obs</th>
                                <th class="p-4 border-b border-outline-variant">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="decapagemTableBody" class="text-body-md font-body-md"></tbody>
                    </table>
                </div>
            </section>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
                <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
                    <div class="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                        <h3 class="text-body-lg font-body-lg font-bold text-on-surface">📦 Estoque (Decapagem)</h3>
                        <div class="flex gap-2 text-label-sm">
                            <button id="toggleDecapagemRetifica" class="active bg-surface-container-low px-2 py-1 rounded">Retífica <span id="countDecapagemRetifica">0</span></button>
                            <button id="toggleDecapagemRb1" class="px-2 py-1 rounded">RB1 <span id="countDecapagemRb1">0</span></button>
                        </div>
                    </div>
                    <div class="p-4" style="min-height:200px;">
                        <div id="inventoryDecapagemList" class="flex flex-col gap-2"></div>
                        <div id="inventoryDecapagemEmpty" class="text-center text-outline-variant p-4">Nenhum rolo nesta categoria</div>
                    </div>
                </section>
                
                <section class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
                    <div class="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
                        <h3 class="text-body-lg font-body-lg font-bold text-on-surface">📅 Trocas por Mês (Decapagem)</h3>
                        <div class="flex items-center gap-2">
                            <button id="prevDecapagemYear" class="px-2">◀</button>
                            <span id="yearDecapagemLabel" class="font-bold"></span>
                            <button id="nextDecapagemYear" class="px-2">▶</button>
                        </div>
                    </div>
                    <div class="p-4">
                        <div id="monthDecapagemTabs" class="flex gap-2 mb-4 overflow-x-auto"></div>
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-surface-container-low text-label-bold font-label-bold text-on-surface-variant uppercase">
                                <tr><th>Data</th><th>Posição</th><th>Turno</th><th>Motivo</th><th>Idade</th></tr>
                            </thead>
                            <tbody id="monthDecapagemBody" class="text-body-md font-body-md"></tbody>
                        </table>
                        <div id="monthDecapagemEmpty" class="text-center text-outline-variant p-4">Nenhuma troca neste mês</div>
                        <div id="monthDecapagemSummary" class="mt-4"></div>
                    </div>
                </section>
            </div>
            
        </div>
    </main>

""" + modals

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    print("index.html updated successfully")

if __name__ == "__main__":
    update_html()
