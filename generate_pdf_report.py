#!/usr/bin/env python3
"""
BugBounty Enterprise Platform — PDF Report Generator
Generates a publication-grade technical report PDF for the BugBounty MERN platform.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# ==============================================================================
# COLOR PALETTE DEFINITION
# ==============================================================================
PRIMARY = HexColor("#0F172A")       # Deep Navy Slate (Headings, primary brand)
SECONDARY = HexColor("#1E293B")     # Dark Slate (Subheadings)
ACCENT_BLUE = HexColor("#2563EB")   # Royal Blue (Primary highlights)
ACCENT_CYAN = HexColor("#0284C7")   # Sky/Cyan Blue (Tech tags, links)
SUCCESS = HexColor("#059669")       # Emerald Green (Accept, pass, positive)
WARNING = HexColor("#D97706")       # Amber (Caution, triaged)
DANGER = HexColor("#DC2626")        # Crimson (Critical, rejected, risks)
BG_LIGHT = HexColor("#F8FAFC")      # Slate 50 (Table header, code background)
BG_ALT = HexColor("#F1F5F9")        # Slate 100 (Alternate rows)
BORDER_COLOR = HexColor("#CBD5E1")  # Slate 300 (Clean borders)
TEXT_DARK = HexColor("#0F172A")     # Body dark text
TEXT_MUTED = HexColor("#475569")    # Subdued description text
WHITE = HexColor("#FFFFFF")

# ==============================================================================
# NUMBERED CANVAS FOR RUNNING HEADER & FOOTER
# ==============================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        # Suppress headers and footers on cover page (Page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(TEXT_MUTED)

        # Running Header
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(45, 745, 567, 745)
        self.drawString(45, 750, "BUGBOUNTY ENTERPRISE PLATFORM — TECHNICAL SPECIFICATION & PROJECT REPORT")
        self.setFont("Helvetica", 8)
        self.drawRightString(567, 750, "MERN STACK ARCHITECTURE")

        # Running Footer
        self.line(45, 45, 567, 45)
        self.drawString(45, 33, "CONFIDENTIAL & PROPRIETARY — SYSTEM DESIGN & SECURITY SPECIFICATION")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(567, 33, page_str)
        self.restoreState()

# ==============================================================================
# STYLES SETUP
# ==============================================================================
def create_styles():
    base = getSampleStyleSheet()

    custom_styles = {
        'DocTitle': ParagraphStyle(
            'DocTitle',
            parent=base['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=29,
            textColor=PRIMARY,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        'DocSubtitle': ParagraphStyle(
            'DocSubtitle',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=11.5,
            leading=15,
            textColor=TEXT_MUTED,
            alignment=TA_LEFT,
            spaceAfter=12,
        ),
        'SectionH1': ParagraphStyle(
            'SectionH1',
            parent=base['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=PRIMARY,
            spaceBefore=10,
            spaceAfter=4,
            keepWithNext=True,
        ),
        'SectionH2': ParagraphStyle(
            'SectionH2',
            parent=base['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=ACCENT_BLUE,
            spaceBefore=8,
            spaceAfter=3,
            keepWithNext=True,
        ),
        'SectionH3': ParagraphStyle(
            'SectionH3',
            parent=base['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=12.5,
            textColor=SECONDARY,
            spaceBefore=6,
            spaceAfter=2,
            keepWithNext=True,
        ),
        'Body': ParagraphStyle(
            'Body',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.2,
            leading=11.2,
            textColor=TEXT_DARK,
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        'BodyJustify': ParagraphStyle(
            'BodyJustify',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.2,
            leading=11.2,
            textColor=TEXT_DARK,
            alignment=TA_JUSTIFY,
            spaceAfter=4,
        ),
        'BulletText': ParagraphStyle(
            'BulletText',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=8.2,
            leading=11,
            textColor=TEXT_DARK,
            leftIndent=10,
            spaceAfter=2.5,
        ),
        'TableHeader': ParagraphStyle(
            'TableHeader',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.8,
            leading=10,
            textColor=WHITE,
            alignment=TA_LEFT,
        ),
        'TableCell': ParagraphStyle(
            'TableCell',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=9.5,
            textColor=TEXT_DARK,
            alignment=TA_LEFT,
        ),
        'TableCellBold': ParagraphStyle(
            'TableCellBold',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=TEXT_DARK,
            alignment=TA_LEFT,
        ),
        'TableCellCode': ParagraphStyle(
            'TableCellCode',
            parent=base['Normal'],
            fontName='Courier',
            fontSize=7,
            leading=9,
            textColor=SECONDARY,
            alignment=TA_LEFT,
        ),
        'CodeSnippet': ParagraphStyle(
            'CodeSnippet',
            parent=base['Normal'],
            fontName='Courier',
            fontSize=7.2,
            leading=9.8,
            textColor=SECONDARY,
            leftIndent=8,
            rightIndent=8,
            spaceBefore=3,
            spaceAfter=4,
        ),
        'CalloutText': ParagraphStyle(
            'CalloutText',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=7.8,
            leading=10.8,
            textColor=TEXT_DARK,
            alignment=TA_LEFT,
        ),
        'CalloutTitle': ParagraphStyle(
            'CalloutTitle',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.2,
            leading=11,
            textColor=PRIMARY,
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        'MetaLabel': ParagraphStyle(
            'MetaLabel',
            parent=base['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.8,
            leading=10,
            textColor=TEXT_MUTED,
        ),
        'MetaVal': ParagraphStyle(
            'MetaVal',
            parent=base['Normal'],
            fontName='Helvetica',
            fontSize=7.8,
            leading=10,
            textColor=PRIMARY,
        ),
    }

    base.byName.update(custom_styles)
    return base

# ==============================================================================
# UI COMPONENT HELPERS
# ==============================================================================
def make_callout(title, text, style_dict, border_color=ACCENT_BLUE, bg_color=BG_LIGHT):
    """Generates an eye-catching framed callout box."""
    t_par = Paragraph(f"<b>{title}</b>", style_dict['CalloutTitle'])
    b_par = Paragraph(text, style_dict['CalloutText'])
    box_data = [[t_par], [b_par]]
    t = Table(box_data, colWidths=[522])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    return t

def make_section_banner(title, style_dict):
    """Creates a visual header banner with a colored bullet symbol."""
    p = Paragraph(f"<font color='#2563EB'>■</font>  {title}", style_dict['SectionH1'])
    line = HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=2, spaceAfter=6)
    return [p, line]

# ==============================================================================
# MAIN STORY BUILDER
# ==============================================================================
def build_pdf_story(styles):
    story = []

    # ==========================================================================
    # PAGE 1: COVER & EXECUTIVE METADATA
    # ==========================================================================
    banner_table = Table([[
        Paragraph("<font size=9.5 color='#2563EB'><b>ENTERPRISE VULNERABILITY DISCLOSURE & TRIAGE MANAGEMENT PLATFORM</b></font>", styles['Normal'])
    ]], colWidths=[522])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("BugBounty Platform — Engineering Specification & Technical Report", styles['DocTitle']))
    story.append(Paragraph("A Comprehensive Technical and Architectural Analysis of a Full-Stack MERN Vulnerability Disclosure, Risk Assessment, and Bug Bounty Triage Platform", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    # Metadata Grid
    meta_data = [
        [
            Paragraph("Document Type:", styles['MetaLabel']),
            Paragraph("System Architecture & Engineering Specification Report", styles['MetaVal']),
            Paragraph("Date Created:", styles['MetaLabel']),
            Paragraph("September 2026", styles['MetaVal']),
        ],
        [
            Paragraph("Technology Stack:", styles['MetaLabel']),
            Paragraph("MERN (MongoDB WiredTiger, Express, React 18, Node 20) + Socket.IO", styles['MetaVal']),
            Paragraph("Testing Status:", styles['MetaLabel']),
            Paragraph("<font color='#059669'><b>74 / 74 Passing Automated Tests (100%)</b></font>", styles['MetaVal']),
        ],
        [
            Paragraph("Security Baseline:", styles['MetaLabel']),
            Paragraph("OWASP Top 10 Aligned, Strict IDOR Defense, Bcrypt-12, JWT", styles['MetaVal']),
            Paragraph("Database Model:", styles['MetaLabel']),
            Paragraph("Self-Contained Embedded WiredTiger Local Engine (Offline)", styles['MetaVal']),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[95, 205, 80, 142])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Executive Overview Callout
    story.append(make_callout(
        "REPORT PURPOSE & EXECUTIVE STATEMENT",
        "This engineering report provides an exhaustive, authoritative blueprint of the BugBounty platform. "
        "It details the foundational architecture, mathematical risk scoring models, NLP duplicate detection algorithms, "
        "finite state machine triage flows, OWASP Top 10 security countermeasures, database schemas, full REST API endpoints, "
        "and empirical quality verification results. This document is tailored for academic project defense, software engineering "
        "audits, and enterprise architectural reviews.",
        styles, border_color=ACCENT_BLUE, bg_color=BG_LIGHT
    ))
    story.append(Spacer(1, 10))

    # KPI Summary Cards Table
    kpi_data = [
        [
            Paragraph("<b>74 Tests</b><br/><font size=6.5 color='#475569'>Automated QA Suite</font>", styles['TableCellBold']),
            Paragraph("<b>10 State Flows</b><br/><font size=6.5 color='#475569'>FSM Triage Engine</font>", styles['TableCellBold']),
            Paragraph("<b>5 Vectors</b><br/><font size=6.5 color='#475569'>CVSS Risk Scoring</font>", styles['TableCellBold']),
            Paragraph("<b>4 Factors</b><br/><font size=6.5 color='#475569'>NLP Deduplication</font>", styles['TableCellBold']),
            Paragraph("<b>Zero Cloud</b><br/><font size=6.5 color='#475569'>Embedded Local DB</font>", styles['TableCellBold']),
            Paragraph("<b>Real-Time</b><br/><font size=6.5 color='#475569'>Socket.IO Event Bus</font>", styles['TableCellBold']),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[87, 87, 87, 87, 87, 87])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    # Table of Contents
    toc_data = [
        [Paragraph("<b>TABLE OF CONTENTS</b>", styles['TableHeader']), Paragraph("", styles['TableHeader'])],
        [Paragraph("1. Executive Summary & Problem Landscape", styles['TableCellBold']), Paragraph("6. Complete REST API Reference & Protocols", styles['TableCellBold'])],
        [Paragraph("2. System Architecture & High-Level Design", styles['TableCellBold']), Paragraph("7. Verification, Testing & Quality Assurance (74 Tests)", styles['TableCellBold'])],
        [Paragraph("3. Core Functional Modules & Business Logic", styles['TableCellBold']), Paragraph("8. DevOps, Deployment & Local Execution", styles['TableCellBold'])],
        [Paragraph("4. Database Design & Entity Relationship Schemas", styles['TableCellBold']), Paragraph("9. Comparative Evaluation & Future Roadmap", styles['TableCellBold'])],
        [Paragraph("5. Security Engineering & OWASP Defense Matrix", styles['TableCellBold']), Paragraph("10. Project Summary & Team Metadata", styles['TableCellBold'])],
    ]
    toc_table = Table(toc_data, colWidths=[261, 261])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BACKGROUND', (0,1), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(toc_table)

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 2: SECTION 1 - EXECUTIVE SUMMARY & PROBLEM LANDSCAPE
    # ==========================================================================
    story.extend(make_section_banner("1. Executive Summary & Problem Landscape", styles))

    story.append(Paragraph("1.1 Background & Industry Context", styles['SectionH2']))
    story.append(Paragraph(
        "Modern cloud-native and distributed software infrastructures face an unprecedented volume of cyber threats. "
        "While internal security reviews and automated vulnerability scanners are vital components of modern DevSecOps, "
        "they frequently fail to detect subtle business logic flaws, complex multi-step race conditions, and esoteric authorization "
        "bypass vectors. Crowdsourced vulnerability disclosure programs (Bug Bounty programs) have emerged as an indispensable "
        "pillar of defensive cyber resilience, mobilizing global independent ethical hackers to uncover vulnerabilities before "
        "malicious threat actors exploit them.",
        styles['BodyJustify']
    ))

    story.append(Paragraph("1.2 The Problem Statement: Triage Paralysis & Tool Fragmentation", styles['SectionH2']))
    story.append(Paragraph(
        "Despite the undeniable effectiveness of bug bounties, organizations routinely grapple with critical administrative bottlenecks:",
        styles['Body']
    ))
    story.append(Paragraph("• <b>Vulnerability Report Flooding & Noise:</b> Organizations receive hundreds of low-quality, duplicative, or out-of-scope submissions that consume hundreds of manual analyst hours.", styles['BulletText']))
    story.append(Paragraph("• <b>Subjective & Inconsistent Risk Prioritization:</b> Without transparent, standardized algorithmic scoring, severity ratings depend on analyst intuition rather than mathematical risk modeling.", styles['BulletText']))
    story.append(Paragraph("• <b>Opaque Triage Lifecycles & Researcher Attrition:</b> Lack of real-time communication leads to researcher frustration, dispute escalations, and abandonment of the disclosure program.", styles['BulletText']))
    story.append(Paragraph("• <b>Cloud & SaaS Lock-in:</b> Commercial bug bounty platforms enforce expensive recurring subscriptions and mandate uploading sensitive vulnerability data to external third-party multi-tenant clouds.", styles['BulletText']))

    story.append(Paragraph("1.3 Project Solution & Strategic Objectives", styles['SectionH2']))
    story.append(Paragraph(
        "<b>BugBounty</b> is an autonomous, full-stack, enterprise-grade vulnerability management platform designed from first principles "
        "to resolve these systemic operational challenges. It bridges independent security researchers and organizational defense teams "
        "through an auditable, transparent, and mathematically rigorous application platform.",
        styles['BodyJustify']
    ))

    obj_table_data = [
        [Paragraph("Objective", styles['TableHeader']), Paragraph("Implementation Mechanism", styles['TableHeader']), Paragraph("Operational Impact", styles['TableHeader'])],
        [
            Paragraph("Automated Risk Scoring", styles['TableCellBold']),
            Paragraph("Deterministic CVSS v3.1 mathematical engine incorporating 5 multi-vector base metrics.", styles['TableCell']),
            Paragraph("Eliminates subjective triage; instantly standardizes priority bands across all incoming reports.", styles['TableCell']),
        ],
        [
            Paragraph("Intelligent Anti-Duplicate Engine", styles['TableCellBold']),
            Paragraph("NLP tokenization, stopwords removal, asset normalization, and Jaccard similarity algorithms.", styles['TableCell']),
            Paragraph("Detects duplicate reports immediately upon submission, preventing triage fatigue and double payouts.", styles['TableCell']),
        ],
        [
            Paragraph("Auditable State Machine", styles['TableCellBold']),
            Paragraph("Strict finite state transitions with mandatory reason logging and immutable timeline audit events.", styles['TableCell']),
            Paragraph("Guarantees corporate compliance, ISO 27001 auditability, and dispute-free researcher resolution.", styles['TableCell']),
        ],
        [
            Paragraph("Zero-Config Offline Portability", styles['TableCellBold']),
            Paragraph("Embedded local WiredTiger MongoDB engine stored directly in disk storage (`server/data/db`).", styles['TableCell']),
            Paragraph("Enables 100% self-contained local operation on laptops without external cloud dependencies.", styles['TableCell']),
        ],
        [
            Paragraph("Real-Time Event Notification", styles['TableCellBold']),
            Paragraph("Bi-directional Socket.IO WebSocket channels mapped to dedicated authenticated user rooms.", styles['TableCell']),
            Paragraph("Eliminates stale browser states; provides instant alerts for triage status changes and reward disbursements.", styles['TableCell']),
        ],
    ]
    obj_table = Table(obj_table_data, colWidths=[105, 225, 192])
    obj_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(obj_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("1.4 Multi-Persona Workflow Architecture", styles['SectionH2']))
    story.append(Paragraph(
        "The system segregates operational duties cleanly into two primary user personas with distinct access boundaries:",
        styles['Body']
    ))
    story.append(Paragraph("• <b>Security Researcher:</b> Discovers program scopes, reviews Safe Harbor rules, submits technical reports with proof-of-concept evidence, tracks CVSS risk assessments, participates in technical discussions, earns monetary rewards, and climbs the public reputation leaderboard.", styles['BulletText']))
    story.append(Paragraph("• <b>Security Operations / Administrator:</b> Authorizes organizational programs, defines in-scope and out-of-scope assets, reviews proof-of-concept submissions, adjusts severity levels with automated score recalibration, issues monetary bounty disbursements, manages internal private triage notes, and tracks organizational MTTR analytics.", styles['BulletText']))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 3: SECTION 2 - SYSTEM ARCHITECTURE & HIGH-LEVEL DESIGN
    # ==========================================================================
    story.extend(make_section_banner("2. System Architecture & High-Level Design", styles))

    story.append(Paragraph("2.1 Architectural Paradigm & Layered Topology", styles['SectionH2']))
    story.append(Paragraph(
        "BugBounty follows a decoupled, service-oriented <b>MERN (MongoDB, Express, React, Node.js)</b> multi-tier architecture. "
        "The architecture enforces strict separation of concerns, ensuring high maintainability, testability, and horizontal scalability.",
        styles['BodyJustify']
    ))

    arch_rows = [
        [Paragraph("Layer", styles['TableHeader']), Paragraph("Technology Component", styles['TableHeader']), Paragraph("Architectural Responsibilities", styles['TableHeader'])],
        [
            Paragraph("Presentation Layer (Client)", styles['TableCellBold']),
            Paragraph("React 18, Vite 6, Tailwind CSS, Lucide React, Recharts", styles['TableCell']),
            Paragraph("Single Page Application (SPA), role-aware client routing, optimistic UI updates, live WebSocket event subscription, interactive data visualizations.", styles['TableCell']),
        ],
        [
            Paragraph("API Gateway & Routing Layer", styles['TableCellBold']),
            Paragraph("Express.js 4 (ES Modules), HTTP Router", styles['TableCell']),
            Paragraph("RESTful endpoints, JWT verification, role-based authorization gates, rate limiting, request validation, payload sanitization.", styles['TableCell']),
        ],
        [
            Paragraph("Service & Business Logic Layer", styles['TableCellBold']),
            Paragraph("Modular Node.js Service Layer (16 specialized services)", styles['TableCell']),
            Paragraph("Deterministic CVSS calculation, multi-vector NLP duplicate detection, FSM workflow state enforcement, reputation ledger computation, notification dispatcher.", styles['TableCell']),
        ],
        [
            Paragraph("Data Persistence Layer", styles['TableCellBold']),
            Paragraph("MongoDB & Mongoose 8 (Embedded WiredTiger Engine)", styles['TableCell']),
            Paragraph("Schema validation, indexing, compound queries, aggregation pipelines, audit log persistence, zero-cloud disk storage at `server/data/db`.", styles['TableCell']),
        ],
        [
            Paragraph("Asynchronous Real-Time Layer", styles['TableCellBold']),
            Paragraph("Socket.IO WebSocket Server", styles['TableCell']),
            Paragraph("Low-latency bi-directional push messaging, user-specific room multiplexing, instant status synchronization across active browser tabs.", styles['TableCell']),
        ],
    ]
    arch_table = Table(arch_rows, colWidths=[105, 155, 262])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.2 Zero-Config Embedded Local Database Architecture", styles['SectionH2']))
    story.append(Paragraph(
        "A standout architectural achievement of the platform is its <b>100% self-contained embedded local database</b>. "
        "Unlike standard web applications that require external cloud database credentials or cumbersome system service installations, "
        "BugBounty embeds an automated local MongoDB engine that stores database files directly within `server/data/db/`:",
        styles['BodyJustify']
    ))
    story.append(Paragraph("• <b>Zero Cloud Dependency:</b> Functions completely offline without internet connectivity or cloud subscriptions.", styles['BulletText']))
    story.append(Paragraph("• <b>Disk Persistence Across Reboots:</b> Uses authentic WiredTiger document storage engines, preserving all users, programs, reports, and rewards across application restarts.", styles['BulletText']))
    story.append(Paragraph("• <b>Full Mongoose ODM Compatibility:</b> Retains 100% fidelity with standard Mongoose schemas, compound indexes, aggregation pipelines, and pre-save lifecycle hooks.", styles['BulletText']))

    story.append(Spacer(1, 6))

    story.append(Paragraph("2.3 Monorepo File System Structure", styles['SectionH2']))
    story.append(Paragraph(
        "The project workspace is organized into a modular monorepo with clear separation between client, server, and DevOps configs:",
        styles['Body']
    ))
    story.append(Paragraph(
        "<code>bugbounty-platform/</code><br/>"
        "├── <code>client/</code> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# React 18 SPA (Vite, Tailwind, Recharts, Contexts, Pages)<br/>"
        "├── <code>server/</code> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Express API, Socket.IO, Controllers, Services, Models, Tests<br/>"
        "│ &nbsp;&nbsp;├── <code>data/db/</code> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Embedded WiredTiger persistent database files<br/>"
        "│ &nbsp;&nbsp;├── <code>services/</code> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Business logic (Risk engine, duplicate detection, FSM)<br/>"
        "│ &nbsp;&nbsp;├── <code>tests/</code> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# 74 automated unit, integration, and security tests<br/>"
        "│ &nbsp;&nbsp;└── <code>uploads/evidence/</code> &nbsp;# Secure local file storage for PoC files<br/>"
        "├── <code>docker-compose.yml</code> &nbsp;&nbsp;&nbsp;&nbsp;# Production multi-container orchestration (Mongo, API, Nginx)<br/>"
        "└── <code>package.json</code> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Root orchestrator (`npm run dev` starts all tiers concurrently)",
        styles['CodeSnippet']
    ))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 4: SECTION 3 (PART 1) - CORE FUNCTIONAL MODULES & CVSS ENGINE
    # ==========================================================================
    story.extend(make_section_banner("3. Core Functional Modules & Business Logic", styles))

    story.append(Paragraph("3.1 Module A: Authentication, Authorization & RBAC", styles['SectionH2']))
    story.append(Paragraph(
        "Identity management is governed by a secure, stateless JSON Web Token (JWT) architecture paired with bcrypt password hashing "
        "(12 salt rounds). The system enforces strict Role-Based Access Control (RBAC):",
        styles['BodyJustify']
    ))
    story.append(Paragraph("• <b>Safe Default Role:</b> Public registration strictly defaults to the `researcher` role, preventing unauthorized administrative provisioning.", styles['BulletText']))
    story.append(Paragraph("• <b>Cryptographic Admin Secret Guard:</b> Elevation to the `admin` role requires supplying a cryptographically verified server-side passkey (`ADMIN_SECRET`). Any registration attempting admin escalation without this key is rejected with `403 Forbidden`.", styles['BulletText']))
    story.append(Paragraph("• <b>Stateless JWT Bearer Protocol:</b> Authenticated sessions transmit an `Authorization: Bearer <jwt>` header containing user ID and role claims signed with HMAC-SHA256, verified via the `protect` and `adminOnly` middleware.", styles['BulletText']))

    story.append(Paragraph("3.2 Module B: Bounty Programs & Dynamic Scope Management", styles['SectionH2']))
    story.append(Paragraph(
        "Organizations publish structured bounty programs that establish explicit legal and technical boundaries:",
        styles['BodyJustify']
    ))
    story.append(Paragraph("• <b>In-Scope Target Specification:</b> Whitelisted targets with asset classification (`api`, `web_application`, `mobile`, `infrastructure`).", styles['BulletText']))
    story.append(Paragraph("• <b>Out-of-Scope Target Exclusion:</b> Explicit blacklists of forbidden targets (e.g. third-party integrations, staging sandboxes, marketing blogs).", styles['BulletText']))
    story.append(Paragraph("• <b>Legal Safe Harbor Guarantee:</b> Formal legal contract ensuring good-faith researchers operating within scope will not face legal prosecution under the Computer Fraud and Abuse Act (CFAA).", styles['BulletText']))
    story.append(Paragraph("• <b>Tiered Monetary Ranges:</b> Defined reward bounds (e.g. $200 minimum to $10,000 maximum per validated finding).", styles['BulletText']))

    story.append(Paragraph("3.3 Module C: Deterministic CVSS v3.1 Risk-Scoring Engine", styles['SectionH2']))
    story.append(Paragraph(
        "Rather than relying on arbitrary severity selections, BugBounty implements an algorithmic, explainable "
        "risk engine modeled on the <b>Common Vulnerability Scoring System (CVSS v3.1)</b>. The calculation computes a normalized score between 0.0 and 10.0:",
        styles['BodyJustify']
    ))

    # Formula Box
    formula_text = (
        "<b>CVSS Risk Score Mathematical Model:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Raw Score</b> = (Impact.weight × Exploitability.multiplier × AttackVector.multiplier × AuthRequirements.multiplier) + DataExposure.bonus<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Final Score</b> = clamp(Raw Score, 0.0, 10.0), rounded to 1 decimal place."
    )
    story.append(make_callout("MATHEMATICAL SCORING FORMULA", formula_text, styles, border_color=ACCENT_CYAN, bg_color=BG_LIGHT))
    story.append(Spacer(1, 5))

    # CVSS Metric Weight Table
    cvss_table_data = [
        [Paragraph("Metric Vector", styles['TableHeader']), Paragraph("Option Level", styles['TableHeader']), Paragraph("Factor Value", styles['TableHeader']), Paragraph("Technical Definition / Scope", styles['TableHeader'])],
        [Paragraph("<b>Impact</b>", styles['TableCellBold']), Paragraph("Critical<br/>High<br/>Medium<br/>Low<br/>None", styles['TableCell']), Paragraph("10.0<br/>7.5<br/>5.0<br/>2.5<br/>0.0", styles['TableCellBold']), Paragraph("Full takeover / total exposure<br/>Extensive breach or compromise<br/>Partial service disruption / read<br/>Minor non-sensitive component<br/>Zero system impact", styles['TableCell'])],
        [Paragraph("<b>Exploitability</b>", styles['TableCellBold']), Paragraph("High<br/>Functional<br/>PoC<br/>Unproven", styles['TableCell']), Paragraph("1.20×<br/>1.05×<br/>0.95×<br/>0.80×", styles['TableCellBold']), Paragraph("Weaponized exploit in the wild<br/>Autonomous exploit code exists<br/>Proof-of-concept demonstrated<br/>Theoretical vulnerability only", styles['TableCell'])],
        [Paragraph("<b>Attack Vector</b>", styles['TableCellBold']), Paragraph("Network<br/>Adjacent Net<br/>Local<br/>Physical", styles['TableCell']), Paragraph("1.00×<br/>0.80×<br/>0.60×<br/>0.30×", styles['TableCellBold']), Paragraph("Public internet exploitable<br/>VPN or local subnet access needed<br/>Local shell / console access<br/>Physical device access required", styles['TableCell'])],
        [Paragraph("<b>Data Exposure</b>", styles['TableCellBold']), Paragraph("Credentials/Fin<br/>PII/Confidential<br/>Internal Logs<br/>None", styles['TableCell']), Paragraph("+3.5 bonus<br/>+2.0 bonus<br/>+0.8 bonus<br/>+0.0 bonus", styles['TableCellBold']), Paragraph("Plaintext keys, tokens, banking<br/>User identities, emails, SSNs<br/>Non-sensitive internal telemetry<br/>No sensitive data leakage", styles['TableCell'])],
        [Paragraph("<b>Auth Requirements</b>", styles['TableCellBold']), Paragraph("None<br/>Authenticated<br/>Admin Privileged", styles['TableCell']), Paragraph("1.00×<br/>0.75×<br/>0.50×", styles['TableCellBold']), Paragraph("Zero authentication (Anonymous)<br/>Standard user account needed<br/>Privileged / Administrator account", styles['TableCell'])],
    ]
    cvss_table = Table(cvss_table_data, colWidths=[90, 85, 80, 267])
    cvss_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(cvss_table)

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 5: SECTION 3 (PART 2) - DUPLICATE DETECTION & STATE MACHINE
    # ==========================================================================
    # Risk Band Breakdown Table
    story.append(Paragraph("3.3.1 CVSS Risk Bands, Severity Mapping & SLA Matrix", styles['SectionH3']))
    bands_data = [
        [Paragraph("Score Range", styles['TableHeader']), Paragraph("Risk Band", styles['TableHeader']), Paragraph("Recommended Severity", styles['TableHeader']), Paragraph("Reputation Award", styles['TableHeader']), Paragraph("Triage SLA Priority", styles['TableHeader'])],
        [Paragraph("<b>9.0 — 10.0</b>", styles['TableCellBold']), Paragraph("<font color='#DC2626'><b>Critical</b></font>", styles['TableCellBold']), Paragraph("Critical", styles['TableCellBold']), Paragraph("<b>+100 Points</b>", styles['TableCellBold']), Paragraph("Immediate (SLA < 4 hours)", styles['TableCell'])],
        [Paragraph("<b>7.0 — 8.9</b>", styles['TableCellBold']), Paragraph("<font color='#EA580C'><b>High</b></font>", styles['TableCellBold']), Paragraph("High", styles['TableCellBold']), Paragraph("<b>+50 Points</b>", styles['TableCellBold']), Paragraph("High Priority (SLA < 24 hours)", styles['TableCell'])],
        [Paragraph("<b>4.0 — 6.9</b>", styles['TableCellBold']), Paragraph("<font color='#D97706'><b>Medium</b></font>", styles['TableCellBold']), Paragraph("Medium", styles['TableCellBold']), Paragraph("<b>+25 Points</b>", styles['TableCellBold']), Paragraph("Standard (SLA < 72 hours)", styles['TableCell'])],
        [Paragraph("<b>0.1 — 3.9</b>", styles['TableCellBold']), Paragraph("<font color='#059669'><b>Low</b></font>", styles['TableCellBold']), Paragraph("Low", styles['TableCellBold']), Paragraph("<b>+10 Points</b>", styles['TableCellBold']), Paragraph("Routine (SLA < 7 days)", styles['TableCell'])],
        [Paragraph("<b>0.0</b>", styles['TableCellBold']), Paragraph("None", styles['TableCell']), Paragraph("Informational", styles['TableCell']), Paragraph("0 Points", styles['TableCell']), Paragraph("Informational / Backlog", styles['TableCell'])],
    ]
    bands_table = Table(bands_data, colWidths=[80, 80, 110, 110, 142])
    bands_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(bands_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("3.4 Module D: Multi-Vector Anti-Duplicate Detection Engine", styles['SectionH2']))
    story.append(Paragraph(
        "Vulnerability deduplication is a major challenge in crowdsourced security. BugBounty eliminates duplicate triage overhead "
        "through an autonomous natural language and structural similarity engine that evaluates 4 discrete comparison vectors:",
        styles['BodyJustify']
    ))

    dup_vector_data = [
        [Paragraph("Vector", styles['TableHeader']), Paragraph("Weight", styles['TableHeader']), Paragraph("Comparison Methodology", styles['TableHeader']), Paragraph("Description", styles['TableHeader'])],
        [
            Paragraph("<b>Target Asset URL</b>", styles['TableCellBold']),
            Paragraph("<b>25%</b>", styles['TableCellBold']),
            Paragraph("Protocol stripping, hostname & path prefix matching", styles['TableCell']),
            Paragraph("Normalized string comparison (1.0 for exact, 0.75 for containment, 0.5 for shared host).", styles['TableCell']),
        ],
        [
            Paragraph("<b>Vulnerability Title</b>", styles['TableCellBold']),
            Paragraph("<b>25%</b>", styles['TableCellBold']),
            Paragraph("Tokenization + Jaccard Set Similarity", styles['TableCell']),
            Paragraph("Lowercased, filtered for stopwords; measures lexical intersection over union.", styles['TableCell']),
        ],
        [
            Paragraph("<b>Technical Content</b>", styles['TableCellBold']),
            Paragraph("<b>35%</b>", styles['TableCellBold']),
            Paragraph("Combined Description & PoC Steps Jaccard", styles['TableCell']),
            Paragraph("Deep textual similarity across technical payload descriptions and reproduction steps.", styles['TableCell']),
        ],
        [
            Paragraph("<b>Vulnerability Category</b>", styles['TableCellBold']),
            Paragraph("<b>15%</b>", styles['TableCellBold']),
            Paragraph("Exact categorical identity match", styles['TableCell']),
            Paragraph("Binary match (1.0 if identical category, 0.0 otherwise).", styles['TableCell']),
        ],
    ]
    dup_vector_table = Table(dup_vector_data, colWidths=[105, 45, 165, 207])
    dup_vector_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(dup_vector_table)
    story.append(Spacer(1, 5))

    story.append(Paragraph("3.5 Module E: Triage Workflow & Finite State Machine (FSM)", styles['SectionH2']))
    story.append(Paragraph(
        "To prevent invalid workflow states (e.g. paying rewards before validating reproduction), the platform enforces "
        "a mathematically strict <b>Finite State Machine (FSM)</b> governed by `workflowService.js`. Any illegal state transition "
        "is intercepted and rejected with `400 Bad Request`.",
        styles['BodyJustify']
    ))

    fsm_table_data = [
        [Paragraph("Current State", styles['TableHeader']), Paragraph("Permitted Next States", styles['TableHeader']), Paragraph("Triggering Action & Side Effects", styles['TableHeader'])],
        [
            Paragraph("<font color='#0284C7'><b>submitted</b></font>", styles['TableCellBold']),
            Paragraph("`under_review`, `rejected`", styles['TableCellCode']),
            Paragraph("Analyst picks up report for initial review; timeline event recorded.", styles['TableCell']),
        ],
        [
            Paragraph("<font color='#D97706'><b>under_review</b></font>", styles['TableCellBold']),
            Paragraph("`triaged`, `rejected`", styles['TableCellCode']),
            Paragraph("Analyst confirms reproduction of the vulnerability; status history updated.", styles['TableCell']),
        ],
        [
            Paragraph("<font color='#2563EB'><b>triaged</b></font>", styles['TableCellBold']),
            Paragraph("`accepted`, `rejected`", styles['TableCellCode']),
            Paragraph("Program owner officially accepts finding. <b>Side Effect: Automatic reputation points awarded to researcher (+10 to +100 based on severity).</b>", styles['TableCell']),
        ],
        [
            Paragraph("<font color='#059669'><b>accepted</b></font>", styles['TableCellBold']),
            Paragraph("`reward_assigned`, `resolved`", styles['TableCellCode']),
            Paragraph("Admin assigns monetary bounty reward, or moves directly to resolution.", styles['TableCell']),
        ],
        [
            Paragraph("<font color='#059669'><b>reward_assigned</b></font>", styles['TableCellBold']),
            Paragraph("`resolved`", styles['TableCellCode']),
            Paragraph("Bounty transaction finalized. Researcher receives WebSocket push notification.", styles['TableCell']),
        ],
        [
            Paragraph("<font color='#DC2626'><b>rejected</b></font>", styles['TableCellBold']),
            Paragraph("`under_review` (Appeal)", styles['TableCellCode']),
            Paragraph("Report rejected with reason. May only be reopened if researcher submits valid appeal.", styles['TableCell']),
        ],
        [
            Paragraph("<b>resolved</b>", styles['TableCellBold']),
            Paragraph("None (Terminal State)", styles['TableCellCode']),
            Paragraph("Patch deployed to production and confirmed; finding closed permanently.", styles['TableCell']),
        ],
    ]
    fsm_table = Table(fsm_table_data, colWidths=[90, 150, 282])
    fsm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(fsm_table)

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 6: SECTION 4 - DATABASE SCHEMA & DATA MODELING
    # ==========================================================================
    story.extend(make_section_banner("4. Database Schema & Data Modeling", styles))

    story.append(Paragraph("4.1 Entity Relationship Architecture", styles['SectionH2']))
    story.append(Paragraph(
        "The persistence layer utilizes Mongoose 8 object modeling on top of the embedded local WiredTiger database engine. "
        "The schema model enforces strict type definitions, enum constraints, embedded subdocuments, and automated referential indexing.",
        styles['BodyJustify']
    ))

    schema_summary_data = [
        [Paragraph("Collection / Model", styles['TableHeader']), Paragraph("Key Fields & Types", styles['TableHeader']), Paragraph("Relationships & Foreign Keys", styles['TableHeader']), Paragraph("Special Constraints & Indexes", styles['TableHeader'])],
        [
            Paragraph("<b>User</b>", styles['TableCellBold']),
            Paragraph("name (String), email (String, unique), password (String, hashed), role (enum: 'researcher', 'admin'), reputation (Number), isActive (Boolean)", styles['TableCell']),
            Paragraph("Referenced by reports, comments, rewards, reputation logs", styles['TableCell']),
            Paragraph("Unique index on email; bcrypt 12 salt rounds; default role: 'researcher'.", styles['TableCell']),
        ],
        [
            Paragraph("<b>BountyProgram</b>", styles['TableCellBold']),
            Paragraph("companyName (String), title (String), description (String), scope { inScope[], outOfScope[] }, rules (String), rewardRange { min, max, currency }, status (enum)", styles['TableCell']),
            Paragraph("createdBy -> User (_id)", styles['TableCell']),
            Paragraph("Text search index on title, companyName, description; status: 'active', 'paused', 'closed'.", styles['TableCell']),
        ],
        [
            Paragraph("<b>VulnerabilityReport</b>", styles['TableCellBold']),
            Paragraph("title, category, affectedAsset, reproductionSteps, impact, severity, status, riskScore, riskAssessment {}, duplicateCheck {}, evidence [], statusHistory [], timelineEvents []", styles['TableCell']),
            Paragraph("programId -> BountyProgram<br/>researcherId -> User<br/>assignedTo -> User", styles['TableCell']),
            Paragraph("Compound index on (programId, status); automated riskScore calculation; timeline audit array.", styles['TableCell']),
        ],
        [
            Paragraph("<b>Comment</b>", styles['TableCellBold']),
            Paragraph("message (String), isInternal (Boolean), createdAt (Date)", styles['TableCell']),
            Paragraph("reportId -> VulnerabilityReport<br/>authorId -> User", styles['TableCell']),
            Paragraph("isInternal flag strictly sanitized for researcher responses (IDOR defense).", styles['TableCell']),
        ],
        [
            Paragraph("<b>Reward</b>", styles['TableCellBold']),
            Paragraph("amount (Number), currency (String), status (enum: 'authorized', 'paid', 'cancelled'), notes (String)", styles['TableCell']),
            Paragraph("reportId -> VulnerabilityReport<br/>researcherId -> User<br/>programId -> BountyProgram", styles['TableCell']),
            Paragraph("One-to-one report binding; updates report.bountyReward automatically.", styles['TableCell']),
        ],
        [
            Paragraph("<b>Notification</b>", styles['TableCellBold']),
            Paragraph("type (String), title (String), message (String), link (String), isRead (Boolean), createdAt (Date)", styles['TableCell']),
            Paragraph("recipientId -> User (_id)", styles['TableCell']),
            Paragraph("Index on (recipientId, isRead); unread count aggregation pipeline.", styles['TableCell']),
        ],
        [
            Paragraph("<b>ReputationLog</b>", styles['TableCellBold']),
            Paragraph("points (Number), reason (String), previousReputation (Number), newReputation (Number), timestamp (Date)", styles['TableCell']),
            Paragraph("researcherId -> User<br/>reportId -> VulnerabilityReport", styles['TableCell']),
            Paragraph("Immutable append-only ledger for gamification and leaderboard auditing.", styles['TableCell']),
        ],
    ]
    schema_table = Table(schema_summary_data, colWidths=[90, 162, 130, 140])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(schema_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("4.2 Audit Trails & Event Sourcing Architecture", styles['SectionH2']))
    story.append(Paragraph(
        "Enterprise bug bounty platforms require non-repudiation and exhaustive audit trails. BugBounty satisfies this through two "
        "integrated audit mechanisms in each `VulnerabilityReport` document:",
        styles['BodyJustify']
    ))
    story.append(Paragraph("1. <b>Status History (`statusHistory` array):</b> Records every state transition, the user ID of the administrator making the change, an explanatory triage note, and a timestamp.", styles['BulletText']))
    story.append(Paragraph("2. <b>Chronological Timeline (`timelineEvents` array):</b> Event-sourced log tracking report creation, severity modifications, triage notes, reputation disbursements, and reward authorizations.", styles['BulletText']))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 7: SECTION 5 - SECURITY ENGINEERING & OWASP MATRIX
    # ==========================================================================
    story.extend(make_section_banner("5. Security Engineering & OWASP Defense Matrix", styles))

    story.append(Paragraph("5.1 Defense-in-Depth Security Philosophy", styles['SectionH2']))
    story.append(Paragraph(
        "Because a bug bounty platform is inherently targeted by sophisticated adversaries, the software must demonstrate "
        "flawless security engineering. The system adopts a strict <b>Defense-in-Depth</b> strategy addressing every category of the "
        "<b>OWASP Top 10 Web Application Security Risks</b>:",
        styles['BodyJustify']
    ))

    sec_matrix_data = [
        [Paragraph("OWASP Risk Category", styles['TableHeader']), Paragraph("Vulnerability Vector", styles['TableHeader']), Paragraph("Defensive Countermeasure Implemented", styles['TableHeader']), Paragraph("Verification Test", styles['TableHeader'])],
        [
            Paragraph("<b>A01: Broken Access Control</b>", styles['TableCellBold']),
            Paragraph("Insecure Direct Object Reference (IDOR) on reports, comments, notifications", styles['TableCell']),
            Paragraph("Strict ownership verification middleware. Non-admin users attempting to view or alter other users' reports or notifications receive `403 Forbidden`.", styles['TableCell']),
            Paragraph("Automated IDOR unit tests in `phase5_e2e_security.test.js`", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>A02: Cryptographic Failures</b>", styles['TableCellBold']),
            Paragraph("Weak password hashing, token tampering", styles['TableCell']),
            Paragraph("Bcrypt hashing with 12 salt rounds; tamper-proof signed JWTs with expiration timestamps; passwords never returned in API payloads (`select: false`).", styles['TableCell']),
            Paragraph("Verified in `auth.test.js`", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>A03: Injection</b>", styles['TableCellBold']),
            Paragraph("NoSQL operator injection (`$gt`, `$ne`, `$regex`)", styles['TableCell']),
            Paragraph("`express-mongo-sanitize` middleware strips reserved MongoDB operators; Mongoose typed casting enforces valid ObjectIDs and primitives.", styles['TableCell']),
            Paragraph("NoSQL injection test in `phase5_e2e_security.test.js`", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>A04: Insecure Design</b>", styles['TableCellBold']),
            Paragraph("Bypassing triage state machine to claim unpaid bounties", styles['TableCell']),
            Paragraph("Centralized Finite State Machine (`workflowService.js`) prohibits illegal state leaps; reward assignment requires active `accepted` status.", styles['TableCell']),
            Paragraph("FSM transition tests in `phase4.test.js`", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>A05: Security Misconfiguration</b>", styles['TableCellBold']),
            Paragraph("Clickjacking, MIME sniffing, missing security headers", styles['TableCell']),
            Paragraph("`helmet` middleware enforces strict HTTP security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS, strict CSP).", styles['TableCell']),
            Paragraph("Verified in HTTP header audit suite", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>A07: Identification & Auth Failures</b>", styles['TableCellBold']),
            Paragraph("Credential brute-forcing, dictionary attacks", styles['TableCell']),
            Paragraph("`express-rate-limit` enforces 30 requests per 15-minute window on `/api/auth/login` and `/api/auth/register` endpoints.", styles['TableCell']),
            Paragraph("Rate limit integration tests", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>A08: Software & Data Integrity</b>", styles['TableCellBold']),
            Paragraph("Malicious file uploads (executable web shells)", styles['TableCell']),
            Paragraph("Multer file filter checks MIME types and extensions against strict whitelist (images, PDFs, JSON); random UUID renaming prevents directory traversal.", styles['TableCell']),
            Paragraph("Malicious `.exe`/`.php` upload rejection tests", styles['TableCellBold']),
        ],
    ]
    sec_matrix_table = Table(sec_matrix_data, colWidths=[105, 125, 192, 100])
    sec_matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sec_matrix_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("5.2 Sensitive Data Scrubbing in Internal Comments", styles['SectionH2']))
    story.append(Paragraph(
        "A dedicated security feature within `commentService.js` protects organizational triage discussions. "
        "Triage analysts can post comments flagged with `isInternal: true` to record confidential remediation deliberations. "
        "When a researcher requests the comment thread, the API pipeline dynamically strips internal comments via a projection filter, "
        "ensuring sensitive remediation notes are never leaked to external parties.",
        styles['BodyJustify']
    ))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 8: SECTION 6 - COMPLETE REST API SPECIFICATION
    # ==========================================================================
    story.extend(make_section_banner("6. Complete REST API Specification", styles))

    story.append(Paragraph("6.1 Standard JSON Response Envelopes", styles['SectionH2']))
    story.append(Paragraph(
        "All platform endpoints adhere to predictable, uniform JSON response envelopes:",
        styles['Body']
    ))

    # Envelope code example
    story.append(Paragraph(
        "<b>Success Response (200 OK / 201 Created):</b><br/>"
        "<font color='#059669'><code>{\"success\": true, \"message\": \"...\", \"data\": { ... }}</code></font><br/>"
        "<b>Error Response (400 / 401 / 403 / 404 / 409 / 500):</b><br/>"
        "<font color='#DC2626'><code>{\"success\": false, \"message\": \"...\", \"errors\": { \"field\": \"Validation error\" }}</code></font>",
        styles['CodeSnippet']
    ))

    story.append(Paragraph("6.2 API Endpoint Directory", styles['SectionH2']))

    api_endpoints_data = [
        [Paragraph("HTTP", styles['TableHeader']), Paragraph("Endpoint Route", styles['TableHeader']), Paragraph("Auth & Role", styles['TableHeader']), Paragraph("Operational Purpose & Function", styles['TableHeader'])],
        # Health & Auth
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/health`", styles['TableCellCode']), Paragraph("Public", styles['TableCell']), Paragraph("System operational probe, uptime, and database status.", styles['TableCell'])],
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/auth/register`", styles['TableCellCode']), Paragraph("Public (Rate Limited)", styles['TableCell']), Paragraph("Registers user; default 'researcher'; admin requires secret.", styles['TableCell'])],
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/auth/login`", styles['TableCellCode']), Paragraph("Public (Rate Limited)", styles['TableCell']), Paragraph("Authenticates credentials; issues signed JWT Bearer token.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/auth/profile`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Retrieves current user identity, role, and reputation score.", styles['TableCell'])],
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/auth/logout`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Terminates authenticated client session.", styles['TableCell'])],
        # Programs
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/programs`", styles['TableCellCode']), Paragraph("Optional Auth", styles['TableCell']), Paragraph("Lists programs (Public sees active; Admin sees all).", styles['TableCell'])],
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/programs`", styles['TableCellCode']), Paragraph("Bearer (Admin Only)", styles['TableCell']), Paragraph("Creates new bounty program with in/out scopes and rules.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/programs/:id`", styles['TableCellCode']), Paragraph("Optional Auth", styles['TableCell']), Paragraph("Fetches program scope, rules, and reward boundaries.", styles['TableCell'])],
        [Paragraph("<font color='#D97706'><b>PUT</b></font>", styles['TableCellBold']), Paragraph("`/api/programs/:id`", styles['TableCellCode']), Paragraph("Bearer (Admin Only)", styles['TableCell']), Paragraph("Updates program metadata, reward limits, or status.", styles['TableCell'])],
        # Reports
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/reports`", styles['TableCellCode']), Paragraph("Bearer (Researcher)", styles['TableCell']), Paragraph("Submits finding; auto-computes CVSS & duplicate check.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/reports`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Lists reports (Researcher: own reports; Admin: all reports).", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/reports/:id`", styles['TableCellCode']), Paragraph("Bearer (IDOR Protected)", styles['TableCell']), Paragraph("Fetches report details, risk score, and duplicate matches.", styles['TableCell'])],
        [Paragraph("<font color='#D97706'><b>PATCH</b></font>", styles['TableCellBold']), Paragraph("`/api/reports/:id/status`", styles['TableCellCode']), Paragraph("Bearer (Admin Only)", styles['TableCell']), Paragraph("Executes FSM transition; auto-awards reputation on accept.", styles['TableCell'])],
        [Paragraph("<font color='#D97706'><b>PATCH</b></font>", styles['TableCellBold']), Paragraph("`/api/reports/:id/severity`", styles['TableCellCode']), Paragraph("Bearer (Admin Only)", styles['TableCell']), Paragraph("Overrides severity and dynamically recalibrates CVSS score.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/reports/:id/comments`", styles['TableCellCode']), Paragraph("Bearer (IDOR Protected)", styles['TableCell']), Paragraph("Retrieves comment thread (strips internal notes for researchers).", styles['TableCell'])],
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/reports/:id/comments`", styles['TableCellCode']), Paragraph("Bearer (Participant)", styles['TableCell']), Paragraph("Posts discussion comment or internal triage note.", styles['TableCell'])],
        # Uploads & Rewards
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/upload/evidence`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Uploads PoC evidence (max 5 files, 5MB each, MIME check).", styles['TableCell'])],
        [Paragraph("<font color='#2563EB'><b>POST</b></font>", styles['TableCellBold']), Paragraph("`/api/rewards`", styles['TableCellCode']), Paragraph("Bearer (Admin Only)", styles['TableCell']), Paragraph("Authorizes bounty payment; updates report state & notifies user.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/rewards`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Lists bounty rewards (Personal earnings vs Admin payouts).", styles['TableCell'])],
        # Notifications & Analytics
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/notifications`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Fetches paginated user notifications.", styles['TableCell'])],
        [Paragraph("<font color='#D97706'><b>PATCH</b></font>", styles['TableCellBold']), Paragraph("`/api/notifications/mark-all-read`", styles['TableCellCode']), Paragraph("Bearer (Any Role)", styles['TableCell']), Paragraph("Marks all user notifications as read in bulk.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/analytics/admin`", styles['TableCellCode']), Paragraph("Bearer (Admin Only)", styles['TableCell']), Paragraph("Deep analytics: MTTR hours, velocity, severity distributions.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/analytics/researcher`", styles['TableCellCode']), Paragraph("Bearer (Researcher)", styles['TableCell']), Paragraph("Personal analytics: acceptance rate, earnings over time.", styles['TableCell'])],
        [Paragraph("<font color='#059669'><b>GET</b></font>", styles['TableCellBold']), Paragraph("`/api/leaderboard`", styles['TableCellCode']), Paragraph("Public", styles['TableCell']), Paragraph("Ranks top researchers by validated reputation points.", styles['TableCell'])],
    ]
    api_table = Table(api_endpoints_data, colWidths=[42, 175, 110, 195])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(api_table)

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 9: SECTION 7 - QUALITY ASSURANCE & TESTING (74 TESTS)
    # ==========================================================================
    story.extend(make_section_banner("7. Quality Assurance, Testing & Verification (74 Tests)", styles))

    story.append(Paragraph("7.1 Testing Philosophy & Test Suite Architecture", styles['SectionH2']))
    story.append(Paragraph(
        "Software reliability and security verification are paramount for a vulnerability reporting system. "
        "The project includes <b>74 automated unit, integration, end-to-end, and security audit tests</b> implemented using Jest and Supertest. "
        "All 74 tests execute against an isolated in-memory or ephemeral database instance, achieving <b>100% pass rate</b>.",
        styles['BodyJustify']
    ))

    test_breakdown_data = [
        [Paragraph("Test Suite File", styles['TableHeader']), Paragraph("Tests Count", styles['TableHeader']), Paragraph("Functional Scope & Verification Areas", styles['TableHeader']), Paragraph("Passing Status", styles['TableHeader'])],
        [
            Paragraph("`auth.test.js`", styles['TableCellBold']),
            Paragraph("8 Tests", styles['TableCellBold']),
            Paragraph("User registration, bcrypt-12 hashing, duplicate email rejection (409), login validation, JWT verification, admin secret passkey enforcement.", styles['TableCell']),
            Paragraph("<font color='#059669'><b>8 / 8 PASSED</b></font>", styles['TableCellBold']),
        ],
        [
            Paragraph("`phase2.test.js`", styles['TableCellBold']),
            Paragraph("12 Tests", styles['TableCellBold']),
            Paragraph("Program creation, scope validation, role access guards, public vs admin program visibility, program update lifecycle, safe deletion rules.", styles['TableCell']),
            Paragraph("<font color='#059669'><b>12 / 12 PASSED</b></font>", styles['TableCellBold']),
        ],
        [
            Paragraph("`phase3.test.js`", styles['TableCellBold']),
            Paragraph("18 Tests", styles['TableCellBold']),
            Paragraph("Vulnerability report ingestion, evidence file handling, CVSS v3.1 formula computation, risk band assignment, NLP duplicate similarity scoring.", styles['TableCell']),
            Paragraph("<font color='#059669'><b>18 / 18 PASSED</b></font>", styles['TableCellBold']),
        ],
        [
            Paragraph("`phase4.test.js`", styles['TableCellBold']),
            Paragraph("16 Tests", styles['TableCellBold']),
            Paragraph("FSM state transitions (`submitted` to `resolved`), illegal transition blocking (400), automatic reputation point crediting, reward allocation.", styles['TableCell']),
            Paragraph("<font color='#059669'><b>16 / 16 PASSED</b></font>", styles['TableCellBold']),
        ],
        [
            Paragraph("`phase5_e2e_security.test.js`", styles['TableCellBold']),
            Paragraph("20 Tests", styles['TableCellBold']),
            Paragraph("Full lifecycle E2E accepted finding, full lifecycle rejected finding, IDOR cross-researcher access blocking (403), NoSQL injection defense, privilege escalation prevention.", styles['TableCell']),
            Paragraph("<font color='#059669'><b>20 / 20 PASSED</b></font>", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>Total Verification Coverage</b>", styles['TableCellBold']),
            Paragraph("<b>74 Tests</b>", styles['TableCellBold']),
            Paragraph("<b>Exhaustive automated coverage spanning all architectural layers and security boundaries.</b>", styles['TableCellBold']),
            Paragraph("<font color='#059669'><b>74 / 74 PASSED (100%)</b></font>", styles['TableCellBold']),
        ],
    ]
    test_table = Table(test_breakdown_data, colWidths=[130, 60, 242, 90])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [WHITE, BG_LIGHT]),
        ('BACKGROUND', (0,-1), (-1,-1), BG_ALT),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(test_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("7.2 Security Boundary & IDOR Verification Evidence", styles['SectionH2']))
    story.append(Paragraph(
        "A critical highlight of the test suite is the explicit verification of IDOR protection in `phase5_e2e_security.test.js`:",
        styles['BodyJustify']
    ))
    story.append(Paragraph("• <b>Cross-Researcher Report Isolation:</b> When Researcher B attempts to query `GET /api/reports/:id` for a report authored by Researcher A, the server immediately denies access with `403 Forbidden`.", styles['BulletText']))
    story.append(Paragraph("• <b>Cross-Researcher Comment Isolation:</b> Researcher B is barred from reading or posting to Researcher A's comment discussions (`403 Forbidden`).", styles['BulletText']))
    story.append(Paragraph("• <b>Admin Privilege Verification:</b> Administrative roles possess audited access to all reports for triage purposes while logging all status changes into immutable audit arrays.", styles['BulletText']))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 10: SECTION 8 - DEVOPS, DEPLOYMENT & LOCAL EXECUTION
    # ==========================================================================
    story.extend(make_section_banner("8. DevOps, Deployment & Local Execution", styles))

    story.append(Paragraph("8.1 One-Command Local Development", styles['SectionH2']))
    story.append(Paragraph(
        "The platform includes an automated root task orchestrator. Running a single command initiates all required subsystems concurrently:",
        styles['Body']
    ))
    story.append(Paragraph(
        "<code>$ npm run dev</code><br/>"
        "• Starts Backend Express API & Socket.IO server on <b>http://localhost:5000</b><br/>"
        "• Starts Embedded Local MongoDB Engine with disk storage at <b>server/data/db/</b><br/>"
        "• Starts React Vite Frontend Application on <b>http://localhost:5173</b>",
        styles['CodeSnippet']
    ))
    story.append(Spacer(1, 5))

    story.append(Paragraph("8.2 Environment Configuration Reference", styles['SectionH2']))
    story.append(Paragraph(
        "Application behavior is configured via environment variables specified in `.env` (template in `.env.example`):",
        styles['Body']
    ))

    env_data = [
        [Paragraph("Variable Name", styles['TableHeader']), Paragraph("Default / Example Value", styles['TableHeader']), Paragraph("Purpose & Security Impact", styles['TableHeader'])],
        [Paragraph("`PORT`", styles['TableCellBold']), Paragraph("`5000`", styles['TableCellCode']), Paragraph("Port number for Express HTTP & WebSocket listener.", styles['TableCell'])],
        [Paragraph("`NODE_ENV`", styles['TableCellBold']), Paragraph("`development` | `production`", styles['TableCellCode']), Paragraph("Controls stack trace output and production optimizations.", styles['TableCell'])],
        [Paragraph("`MONGO_URI`", styles['TableCellBold']), Paragraph("`mongodb://localhost:27017/bugbounty`", styles['TableCellCode']), Paragraph("Connection string for standalone or embedded WiredTiger MongoDB.", styles['TableCell'])],
        [Paragraph("`JWT_SECRET`", styles['TableCellBold']), Paragraph("`super_secure_random_key_here`", styles['TableCellCode']), Paragraph("HMAC-SHA256 signing secret for authentication tokens.", styles['TableCell'])],
        [Paragraph("`ADMIN_SECRET`", styles['TableCellBold']), Paragraph("`AdminRegistrationPassphrase2026!`", styles['TableCellCode']), Paragraph("Cryptographic passphrase required to register as `admin`.", styles['TableCell'])],
        [Paragraph("`CLIENT_URL`", styles['TableCellBold']), Paragraph("`http://localhost:5173`", styles['TableCellCode']), Paragraph("Allowed CORS origin for browser API and WebSocket requests.", styles['TableCell'])],
    ]
    env_table = Table(env_data, colWidths=[110, 160, 252])
    env_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(env_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("8.3 Docker Multi-Container Orchestration", styles['SectionH2']))
    story.append(Paragraph(
        "For enterprise production environments, the project provides a containerized multi-tier deployment via `docker-compose.yml`:",
        styles['BodyJustify']
    ))
    story.append(Paragraph("• <b>Client Container:</b> Multi-stage build producing an optimized Nginx web server container serving the compiled React single page application.", styles['BulletText']))
    story.append(Paragraph("• <b>Server Container:</b> Node.js 20 Alpine Linux production image running the Express API and WebSocket listener.", styles['BulletText']))
    story.append(Paragraph("• <b>Database Container:</b> MongoDB 7 container with persistent Docker volume mappings.", styles['BulletText']))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 11: SECTIONS 9 & 10 - COMPARISON, ROADMAP & SUMMARY
    # ==========================================================================
    story.extend(make_section_banner("9. Comparative Evaluation & Future Roadmap", styles))

    story.append(Paragraph("9.1 Competitive Architecture Comparison", styles['SectionH2']))

    comp_data = [
        [Paragraph("Feature / Capability", styles['TableHeader']), Paragraph("Traditional Email / Forms", styles['TableHeader']), Paragraph("Commercial SaaS (HackerOne / Bugcrowd)", styles['TableHeader']), Paragraph("BugBounty MERN Platform", styles['TableHeader'])],
        [
            Paragraph("<b>Cost & Licensing</b>", styles['TableCellBold']),
            Paragraph("Free / Manual", styles['TableCell']),
            Paragraph("High annual subscription ($20k+ / year)", styles['TableCell']),
            Paragraph("<b>Open-Source / Zero Subscription</b>", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>Data Privacy & Hosting</b>", styles['TableCellBold']),
            Paragraph("Insecure inbox storage", styles['TableCell']),
            Paragraph("Third-party multi-tenant cloud", styles['TableCell']),
            Paragraph("<b>100% On-Premise / Self-Contained</b>", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>Risk Prioritization</b>", styles['TableCellBold']),
            Paragraph("Subjective / Unstandardized", styles['TableCell']),
            Paragraph("CVSS Calculator (Manual)", styles['TableCell']),
            Paragraph("<b>Deterministic Automated CVSS Engine</b>", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>Duplicate Prevention</b>", styles['TableCellBold']),
            Paragraph("None (Manual triage)", styles['TableCell']),
            Paragraph("Keyword search based", styles['TableCell']),
            Paragraph("<b>NLP Jaccard Multi-Vector Matching</b>", styles['TableCellBold']),
        ],
        [
            Paragraph("<b>Auditability & State Flow</b>", styles['TableCellBold']),
            Paragraph("Zero formal state tracking", styles['TableCell']),
            Paragraph("Proprietary workflow", styles['TableCell']),
            Paragraph("<b>Strict FSM + Immutable Event Sourcing</b>", styles['TableCellBold']),
        ],
    ]
    comp_table = Table(comp_data, colWidths=[110, 120, 142, 150])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("9.2 Strategic Future Roadmap", styles['SectionH2']))
    story.append(Paragraph("• <b>AI-Powered Remediation Advice:</b> Integrating LLM models (e.g. Gemini API) to generate contextual code fix recommendations for developers upon report acceptance.", styles['BulletText']))
    story.append(Paragraph("• <b>Enterprise SAML / SSO:</b> Adding Okta, Azure AD, and Google Workspace Single Sign-On for enterprise security operations teams.", styles['BulletText']))
    story.append(Paragraph("• <b>Automated Payout Gateways:</b> Direct integration with Stripe Connect or crypto escrow smart contracts for instant bounty disbursement.", styles['BulletText']))
    story.append(Paragraph("• <b>Public Redacted Disclosure:</b> Permitting coordinated disclosure of patched vulnerabilities with automated redaction of sensitive internal data.", styles['BulletText']))

    story.append(Spacer(1, 6))

    story.extend(make_section_banner("10. Project Summary & Technical Conclusion", styles))
    story.append(Paragraph(
        "The <b>BugBounty</b> platform demonstrates an advanced, enterprise-grade synthesis of modern web technologies, "
        "cryptographic security engineering, and algorithmic vulnerability triage. By replacing manual, fragmented workflows "
        "with a deterministic CVSS scoring engine, NLP duplicate detection, an auditable finite state machine, and a self-contained "
        "offline database engine, the platform delivers a production-ready solution capable of scaling from individual educational "
        "laboratories to high-assurance corporate cybersecurity environments.",
        styles['BodyJustify']
    ))
    story.append(Spacer(1, 6))

    # Signoff Box
    signoff_table = Table([[
        Paragraph(
            "<b>PROJECT METRICS & VERIFICATION SUMMARY:</b><br/>"
            "• <b>Total Automated Tests:</b> 74 (100% Pass Rate Across 5 Comprehensive Suites: Auth, Programs, Reports, Triage, E2E Security)<br/>"
            "• <b>Architecture:</b> MERN Stack (React 18 + Vite 6 + Express + Node.js 20 + Embedded WiredTiger Local Database Engine)<br/>"
            "• <b>Security Compliance:</b> OWASP Top 10 Aligned, Strict IDOR & Privilege Escalation Defenses, Bcrypt-12, Signed JWTs<br/>"
            "• <b>Communication:</b> Dual RESTful JSON API + Low-Latency Bi-Directional Socket.IO WebSocket Push Event Bus<br/>"
            "• <b>Report Author:</b> Full-Stack Security Engineering & Development Team",
            styles['CalloutText']
        )
    ]], colWidths=[522])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(signoff_table)

    return story

# ==============================================================================
# SCRIPT EXECUTION
# ==============================================================================
def main():
    output_filename = "/Volumes/maha/fsd/untitled folder/BugBounty_Project_Report.pdf"
    print(f"[PDF Generator] Initializing PDF generation for: {output_filename}")

    # Margins: Left/Right 45pt, Top/Bottom 54pt -> Usable width = 612 - 90 = 522pt
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=54,
        bottomMargin=54
    )

    styles = create_styles()
    story = build_pdf_story(styles)

    print(f"[PDF Generator] Compiling document with {len(story)} flowable elements...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[PDF Generator] SUCCESS: PDF generated at: {output_filename}")
    print(f"[PDF Generator] File size: {os.path.getsize(output_filename):,} bytes")

if __name__ == "__main__":
    main()
