"""
Mock Data Generator for TrafficLens Frontend
=============================================
Reads server/data/Dataset.csv and produces small JSON files for the React frontend.
Run this ONCE before starting frontend dev:
    cd server
    python generate_mocks.py

Output files go to: client/src/mocks/
"""

import pandas as pd
import numpy as np
import ast
import json
import os
from collections import Counter

# ── Paths ────────────────────────────────────────────────────────────────────
CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'Dataset.csv')
OUT_DIR  = os.path.join(os.path.dirname(__file__), '..', 'client', 'src', 'mocks')
os.makedirs(OUT_DIR, exist_ok=True)

print('Loading CSV (this takes ~10s for 298k rows)...')
df = pd.read_csv(CSV_PATH, low_memory=False)
print(f'Loaded: {df.shape}')

# ── Clean and parse ─────────────────────────────────────────────────────────
df['dt'] = pd.to_datetime(df['created_datetime'], utc=True, errors='coerce')
df.dropna(subset=['dt', 'latitude', 'longitude'], inplace=True)
df = df[df['latitude'].between(12.7, 13.3) & df['longitude'].between(77.3, 77.9)]

df['date']       = df['dt'].dt.tz_localize(None).dt.floor('D')
df['hour']       = df['dt'].dt.hour
df['dow']        = df['dt'].dt.dayofweek
df['month']      = df['dt'].dt.month
df['is_weekend'] = (df['dow'] >= 5).astype(int)
df['police_station'] = df['police_station'].fillna('Unknown')
df['junction_name']  = df['junction_name'].fillna('No Junction')
df['validation_status'] = df['validation_status'].fillna('never_reviewed')
df['is_approved']    = (df['validation_status'] == 'approved').astype(int)
df['vehicle_type_clean'] = np.where(
    df['updated_vehicle_type'].notna(),
    df['updated_vehicle_type'], df['vehicle_type']
)

def parse_viol(x):
    try:
        v = ast.literal_eval(str(x))
        return v if isinstance(v, list) else [str(x)]
    except:
        return [str(x)]

df['violations_list'] = df['violation_type'].apply(parse_viol)
df['primary_violation'] = df['violations_list'].apply(
    lambda x: x[0] if x else 'UNKNOWN'
)

# ── 1. Top Hotspots (for map) ───────────────────────────────────────────────
# Generate ~30 hotspot hexagons using simple grid clustering
print('Generating hotspots...')
df['grid_lat'] = (df['latitude'] * 200).round() / 200    # ~500m grid
df['grid_lon'] = (df['longitude'] * 200).round() / 200

hotspot_groups = df.groupby(['grid_lat', 'grid_lon']).agg(
    ticket_count       = ('id', 'count'),
    dominant_violation = ('primary_violation', lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'UNKNOWN'),
    dominant_vehicle   = ('vehicle_type_clean', lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'UNKNOWN'),
    dominant_station   = ('police_station', lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Unknown'),
    approval_rate      = ('is_approved', 'mean'),
    peak_fraction      = ('is_weekend', 'mean'),
    dominant_junction  = ('junction_name', lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'No Junction'),
).reset_index()

hotspot_groups = hotspot_groups.nlargest(35, 'ticket_count').reset_index(drop=True)

# Hotspot scoring
max_tickets = hotspot_groups['ticket_count'].max()
hotspot_groups['hotspot_score']    = (hotspot_groups['ticket_count'] / max_tickets * 100).round(1)
hotspot_groups['congestion_score'] = (hotspot_groups['hotspot_score'] * 0.8 + hotspot_groups['peak_fraction'] * 20).round(1)

def risk_level(s):
    if s >= 75: return 'Critical'
    if s >= 50: return 'High'
    if s >= 25: return 'Medium'
    return 'Low'

hotspot_groups['risk_level'] = hotspot_groups['hotspot_score'].apply(risk_level)

def blockage(row):
    s, rl = row['congestion_score'], row['risk_level']
    if rl == 'Critical': return round(35 + (s - 75) * 0.6, 1)
    if rl == 'High':     return round(20 + (s - 50) * 0.6, 1)
    if rl == 'Medium':   return round(10 + (s - 25) * 0.4, 1)
    return round(5 + s * 0.2, 1)

hotspot_groups['blockage_pct'] = hotspot_groups.apply(blockage, axis=1)

# Mock predictions
np.random.seed(42)
hotspot_groups['predicted_24h']      = (hotspot_groups['ticket_count'] / 150 * np.random.uniform(0.8, 1.4, len(hotspot_groups))).round(0).astype(int)
hotspot_groups['predicted_48h']      = (hotspot_groups['predicted_24h'] * np.random.uniform(1.7, 2.2, len(hotspot_groups))).round(0).astype(int)
hotspot_groups['z_score']            = np.random.uniform(-1, 3.5, len(hotspot_groups)).round(2)
hotspot_groups['anomaly']            = hotspot_groups['z_score'].apply(
    lambda z: 'Extreme' if z >= 3 else 'High' if z >= 2 else 'Moderate' if z >= 1 else 'Normal'
)

hotspots = []
for i, row in hotspot_groups.iterrows():
    hotspots.append({
        'id': f'HOT-{i+1:03d}',
        'lat': round(row['grid_lat'], 5),
        'lon': round(row['grid_lon'], 5),
        'ticket_count': int(row['ticket_count']),
        'risk_level': row['risk_level'],
        'hotspot_score': float(row['hotspot_score']),
        'congestion_score': float(row['congestion_score']),
        'blockage_pct': float(row['blockage_pct']),
        'dominant_violation': row['dominant_violation'],
        'dominant_vehicle': row['dominant_vehicle'],
        'dominant_station': row['dominant_station'],
        'dominant_junction': row['dominant_junction'],
        'approval_rate': round(float(row['approval_rate']), 3),
        'peak_fraction': round(float(row['peak_fraction']), 3),
        'predicted_24h': int(row['predicted_24h']),
        'predicted_48h': int(row['predicted_48h']),
        'z_score': float(row['z_score']),
        'anomaly': row['anomaly'],
    })

with open(os.path.join(OUT_DIR, 'hotspots.json'), 'w') as f:
    json.dump(hotspots, f, indent=2)
print(f'  hotspots.json: {len(hotspots)} hotspots')

# ── 2. Police Stations ──────────────────────────────────────────────────────
print('Generating stations...')
stations = df.groupby('police_station').agg(
    lat       = ('latitude', 'mean'),
    lon       = ('longitude', 'mean'),
    tickets   = ('id', 'count'),
    approval  = ('is_approved', 'mean'),
).reset_index().sort_values('tickets', ascending=False)

stations_list = []
for _, row in stations.iterrows():
    stations_list.append({
        'name': row['police_station'],
        'lat': round(float(row['lat']), 5),
        'lon': round(float(row['lon']), 5),
        'total_tickets': int(row['tickets']),
        'approval_rate': round(float(row['approval']), 3),
        'reject_rate': round(1 - float(row['approval']), 3),
    })

with open(os.path.join(OUT_DIR, 'stations.json'), 'w') as f:
    json.dump(stations_list, f, indent=2)
print(f'  stations.json: {len(stations_list)} stations')

# ── 3. Officers ─────────────────────────────────────────────────────────────
print('Generating officers...')
officer_stats = df.groupby('created_by_id').agg(
    total_tickets   = ('id', 'count'),
    approval_rate   = ('is_approved', 'mean'),
    primary_station = ('police_station', lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Unknown'),
).reset_index()

last_pos = df.sort_values('dt').groupby('created_by_id')[['latitude', 'longitude']].last().reset_index()
last_pos.columns = ['created_by_id', 'last_lat', 'last_lon']
officer_df = officer_stats.merge(last_pos, on='created_by_id', how='left')

# Top 80 officers by ticket count
top_officers = officer_df.nlargest(80, 'total_tickets').reset_index(drop=True)
np.random.seed(42)

officers = []
for i, row in top_officers.iterrows():
    status_options = ['active', 'active', 'active', 'on_patrol', 'available']
    officers.append({
        'id': row['created_by_id'],
        'name': f'Officer {row["created_by_id"][-5:]}',
        'badge_id': f'BTP-{row["created_by_id"][-5:]}',
        'station': row['primary_station'],
        'total_tickets': int(row['total_tickets']),
        'approval_rate': round(float(row['approval_rate']), 3),
        'last_lat': round(float(row['last_lat']), 5) if pd.notna(row['last_lat']) else None,
        'last_lon': round(float(row['last_lon']), 5) if pd.notna(row['last_lon']) else None,
        'status': np.random.choice(status_options),
        'effectiveness_score': round(float(row['approval_rate']) * 100, 1),
    })

with open(os.path.join(OUT_DIR, 'officers.json'), 'w') as f:
    json.dump(officers, f, indent=2)
print(f'  officers.json: {len(officers)} officers')

# ── 4. Pending Officer Registrations (mock approval queue) ──────────────────
np.random.seed(7)
random_stations = list(stations['police_station'].head(20))
pending = []
for i in range(12):
    pending.append({
        'id': f'REG-{1000+i}',
        'name': f'Officer Applicant {i+1}',
        'badge_id': f'BTP-{9000+i}',
        'requested_station': str(np.random.choice(random_stations)),
        'phone': f'+91 9{np.random.randint(100000000, 999999999)}',
        'email': f'officer{i+1}@bengalurupolice.gov.in',
        'applied_on': f'2024-04-{np.random.randint(1, 8):02d}',
        'experience_years': int(np.random.randint(1, 15)),
        'status': 'pending',
    })

with open(os.path.join(OUT_DIR, 'pending_officers.json'), 'w') as f:
    json.dump(pending, f, indent=2)
print(f'  pending_officers.json: {len(pending)} applications')

# ── 5. Top Violations ───────────────────────────────────────────────────────
all_v = [v for vl in df['violations_list'] for v in vl]
vc = Counter(all_v).most_common(15)
violations = [{'name': k, 'count': v} for k, v in vc]
with open(os.path.join(OUT_DIR, 'violations.json'), 'w') as f:
    json.dump(violations, f, indent=2)
print(f'  violations.json: {len(violations)} violation types')

# ── 6. Vehicle Types ────────────────────────────────────────────────────────
vt = df['vehicle_type_clean'].value_counts().head(12)
vehicles = [{'name': k, 'count': int(v)} for k, v in vt.items()]
with open(os.path.join(OUT_DIR, 'vehicles.json'), 'w') as f:
    json.dump(vehicles, f, indent=2)
print(f'  vehicles.json: {len(vehicles)} vehicle types')

# ── 7. Time Series Data ─────────────────────────────────────────────────────
monthly = df.groupby('month').size()
month_names = {11:'Nov-23', 12:'Dec-23', 1:'Jan-24', 2:'Feb-24', 3:'Mar-24', 4:'Apr-24'}
monthly_data = [{'month': month_names.get(m, str(m)), 'tickets': int(c)} for m, c in monthly.items()]

dow_names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
dow_counts = df.groupby('dow').size()
dow_data = [{'day': dow_names[i], 'tickets': int(c)} for i, c in dow_counts.items()]

hourly = df.groupby('hour').size()
hourly_data = [{'hour': int(h), 'tickets': int(c)} for h, c in hourly.items()]

# Daily timeseries (last 30 days for trend chart)
daily = df.groupby('date').size().sort_index().tail(30)
daily_data = [
    {'date': d.strftime('%Y-%m-%d'), 'tickets': int(c)}
    for d, c in daily.items()
]

timeseries = {
    'monthly': monthly_data,
    'daily': dow_data,
    'hourly': hourly_data,
    'daily_trend': daily_data,
}
with open(os.path.join(OUT_DIR, 'timeseries.json'), 'w') as f:
    json.dump(timeseries, f, indent=2)
print(f'  timeseries.json: monthly={len(monthly_data)} daily={len(dow_data)} hourly={len(hourly_data)} trend={len(daily_data)}')

# ── 8. Validation Funnel ────────────────────────────────────────────────────
vs = df['validation_status'].value_counts()
funnel = {
    'total': int(len(df)),
    'reviewed': int(df['validation_status'].isin(['approved','rejected','processing','duplicate']).sum()),
    'approved': int((df['validation_status']=='approved').sum()),
    'rejected': int((df['validation_status']=='rejected').sum()),
    'processing': int((df['validation_status']=='processing').sum()),
    'duplicate': int((df['validation_status']=='duplicate').sum()),
    'never_reviewed': int((df['validation_status']=='never_reviewed').sum()),
}
with open(os.path.join(OUT_DIR, 'funnel.json'), 'w') as f:
    json.dump(funnel, f, indent=2)
print(f'  funnel.json: total={funnel["total"]:,}')

# ── 9. CSV Upload History (mock) ────────────────────────────────────────────
csv_history = [
    {'id': 'UP-001', 'filename': 'jan_to_may_violations.csv', 'uploaded_on': '2024-01-15 10:32', 'rows': 145203, 'status': 'completed', 'uploaded_by': 'admin@btp.in'},
    {'id': 'UP-002', 'filename': 'feb_violations.csv', 'uploaded_on': '2024-02-18 14:21', 'rows': 54660, 'status': 'completed', 'uploaded_by': 'admin@btp.in'},
    {'id': 'UP-003', 'filename': 'mar_violations.csv', 'uploaded_on': '2024-03-19 09:15', 'rows': 55453, 'status': 'completed', 'uploaded_by': 'head@btp.in'},
    {'id': 'UP-004', 'filename': 'apr_partial.csv', 'uploaded_on': '2024-04-09 16:48', 'rows': 15432, 'status': 'completed', 'uploaded_by': 'head@btp.in'},
    {'id': 'UP-005', 'filename': 'may_partial.csv', 'uploaded_on': '2024-05-05 11:22', 'rows': 8294, 'status': 'processing', 'uploaded_by': 'admin@btp.in'},
]
with open(os.path.join(OUT_DIR, 'csv_history.json'), 'w') as f:
    json.dump(csv_history, f, indent=2)
print(f'  csv_history.json: {len(csv_history)} uploads')

# ── 10. Dashboard KPIs ──────────────────────────────────────────────────────
dashboard = {
    'total_violations': int(len(df)),
    'active_hotspots': len([h for h in hotspots if h['risk_level'] in ['Critical', 'High']]),
    'avg_congestion_score': round(float(hotspot_groups['congestion_score'].mean()), 1),
    'pending_approvals': len(pending),
    'critical_zones': len([h for h in hotspots if h['risk_level'] == 'Critical']),
    'predicted_today': sum(h['predicted_24h'] for h in hotspots),
    'approval_rate': round(funnel['approved'] / funnel['total'] * 100, 1),
    'never_reviewed_pct': round(funnel['never_reviewed'] / funnel['total'] * 100, 1),
    'top_violation': vc[0][0],
    'top_vehicle': vehicles[0]['name'],
    'dataset_date_range': {
        'start': str(df['date'].min().date()),
        'end': str(df['date'].max().date()),
    },
}
with open(os.path.join(OUT_DIR, 'dashboard.json'), 'w') as f:
    json.dump(dashboard, f, indent=2)
print(f'  dashboard.json: KPI summary')

# ── 11. XAI / EDI Sample Explanations ───────────────────────────────────────
edi_samples = []
for h in hotspots[:8]:
    edi_samples.append({
        'hotspot_id': h['id'],
        'anomaly_alert': {
            'z_score': h['z_score'],
            'level': h['anomaly'],
            'message': f'This zone is showing {abs(h["z_score"]):.1f}x its normal activity'
                       if abs(h['z_score']) > 1 else 'Activity within expected range',
        },
        'impact_forecast': {
            'if_enforced': {
                'predicted_violations': max(int(h['predicted_24h'] * 0.25), 1),
                'blockage_pct': round(h['blockage_pct'] * 0.3, 1),
                'reduction_pct': 75,
            },
            'if_not_enforced': {
                'predicted_violations': int(h['predicted_24h'] * 1.15),
                'blockage_pct': round(h['blockage_pct'] * 1.3, 1),
                'reduction_pct': 0,
            },
        },
        'cascade_risk': {
            'affected_junctions': np.random.randint(1, 4),
            'lag_minutes': np.random.choice([15, 20, 25, 35]).item(),
            'correlation': round(np.random.uniform(0.5, 0.8), 2),
        },
        'officer_recommendation': {
            'count': 3 if h['risk_level'] == 'Critical' else 2 if h['risk_level'] == 'High' else 1,
            'reason': f'Critical zone with {h["predicted_24h"]} predicted violations',
        },
        'model_confidence': {
            'psi_score': round(np.random.uniform(0.05, 0.35), 2),
            'level': np.random.choice(['Stable', 'Stable', 'Stable', 'Drift Detected']).item(),
        },
        'shap_drivers': [
            {'feature': 'cell_mean_daily', 'value': round(np.random.uniform(20, 120), 1), 'impact': '+RAISES', 'shap': round(np.random.uniform(0.3, 0.6), 3)},
            {'feature': 'same_dow_mean', 'value': round(np.random.uniform(15, 100), 1), 'impact': '+RAISES', 'shap': round(np.random.uniform(0.1, 0.3), 3)},
            {'feature': 'roll_mean_7', 'value': round(np.random.uniform(10, 150), 1), 'impact': '+RAISES', 'shap': round(np.random.uniform(0.05, 0.2), 3)},
        ],
    })

with open(os.path.join(OUT_DIR, 'edi_explanations.json'), 'w') as f:
    json.dump(edi_samples, f, indent=2)
print(f'  edi_explanations.json: {len(edi_samples)} EDI samples')

# ── 12. Recent Activity Feed ────────────────────────────────────────────────
activity = [
    {'time': '2 mins ago', 'type': 'hotspot_alert', 'message': f'New Critical hotspot detected near {stations_list[0]["name"]}', 'severity': 'high'},
    {'time': '15 mins ago', 'type': 'officer_assigned', 'message': f'3 officers assigned to {stations_list[1]["name"]} hotspot', 'severity': 'info'},
    {'time': '32 mins ago', 'type': 'csv_upload', 'message': 'New CSV processed: 8,294 records added', 'severity': 'info'},
    {'time': '1 hour ago', 'type': 'officer_request', 'message': f'New officer registration from {stations_list[2]["name"]}', 'severity': 'info'},
    {'time': '2 hours ago', 'type': 'cascade_warning', 'message': '3-junction cascade pattern detected in central zone', 'severity': 'high'},
    {'time': '3 hours ago', 'type': 'anomaly', 'message': f'Anomaly: {stations_list[3]["name"]} showing 4.2x normal activity', 'severity': 'medium'},
    {'time': '5 hours ago', 'type': 'enforcement', 'message': 'Daily patrol report generated for 14 critical zones', 'severity': 'info'},
]
with open(os.path.join(OUT_DIR, 'activity.json'), 'w') as f:
    json.dump(activity, f, indent=2)
print(f'  activity.json: {len(activity)} entries')

print('\nAll mock data written to:', OUT_DIR)
print('Total mock files:', len(os.listdir(OUT_DIR)))
