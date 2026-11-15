"""Build bounded offline NASA samples from the two downloaded source files.
Usage: python3 scripts/prepare-flight-data.py RR1_DASHBOARD_HTML ARTEMIS_ZIP
Downloads are intentionally separate. No executable content is used from sources.
"""
import hashlib, io, json, math, pathlib, re, sys, zipfile
root = pathlib.Path(__file__).resolve().parents[1] / 'src/data'
html = pathlib.Path(sys.argv[1]).read_text()
raw = json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>', html, re.S)[1])
data = json.loads(raw['telemetry_data'])
rows = [(t, v) for t, v in zip(data['time'], data['co2_iss']) if t.startswith('2014-09-26 ') and isinstance(v, (float, int)) and math.isfinite(v)]
assert len(rows) >= 144
sample = rows[:144:12]  # Twelve raw readings, one per hour; no averaging.
cabin = dict(source='https://visualization.osdr.nasa.gov/eda/dashboard_RR-1', retrieved='2026-11-14', mission='RR-1', location='ISS cabin (EDA co2_iss series)', units='ppm', timeSystem='GMT (source Controller_Time_GMT)', processing='First 144 five-minute rows on 2014-09-26, every twelfth row. No averaging, interpolation, or unit conversion.', sourceSha256=hashlib.sha256(html.encode()).hexdigest(), samples=[dict(time=t, co2=v) for t,v in sample])
(root/'flight-cabin.json').write_text(json.dumps(cabin, indent=2)+'\n')
archive=pathlib.Path(sys.argv[2]).read_bytes()
innerName='Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.zip'
with zipfile.ZipFile(io.BytesIO(archive)) as outer:
 with zipfile.ZipFile(io.BytesIO(outer.read(innerName))) as inner:
  name=inner.namelist()[0]; text=inner.read(name).decode()
metadata=dict(re.findall(r'^(\w+)\s*=\s*(.+)$', text, re.M))
points=[]
for line in text.splitlines():
 fields=line.split()
 if len(fields)==7 and fields[0].startswith('2026-'):
  coords=list(map(float,fields[1:4])); assert all(map(math.isfinite,coords));points.append(dict(time=fields[0],x=coords[0],y=coords[1],z=coords[2]))
assert len(points)>100
indices=sorted(set(round(i*(len(points)-1)/96) for i in range(97)))
trajectory=dict(source='https://www.nasa.gov/wp-content/uploads/2026/03/all-artemis-ii-oem-files.zip', archiveMember=innerName+'/'+name, retrieved='2026-11-14', originator=metadata['ORIGINATOR'], frame=metadata['REF_FRAME'], center=metadata['CENTER_NAME'], timeSystem=metadata['TIME_SYSTEM'], created=metadata['CREATION_DATE'], units='km (CCSDS OEM position)', processing='97 evenly spaced row indices, retaining original UTC and XYZ positions. Display projects XY with uniform scaling. Rows after file creation are predictions from that published solution.', sourceSha256=hashlib.sha256(archive).hexdigest(), samples=[points[i] for i in indices])
(root/'flight-artemis.json').write_text(json.dumps(trajectory,indent=2)+'\n')
print('Cabin:',sample[0],sample[-1]);print('Trajectory:',len(points),'source rows;',len(indices),'samples',metadata)
