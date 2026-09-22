-- Demo data: 20 realistic Indian Railway track fittings + related records
INSERT INTO track_fittings (component_id, qr_id, track_number, railway_zone, station_name, component_type, material, installation_date, last_inspection_date, status, gps_lat, gps_lng, division, section, track_type, manufacturer, maintenance_date, image_url) VALUES
('FIT-100421', 'RQR-FIT-100421A1', 'NDLS-MUM-UP', 'NR', 'New Delhi', 'Rail Joint', 'Manganese Steel', '2023-01-15', '2026-06-20', 'Active', 28.6139, 77.2090, 'Delhi', 'NDLS-MTC', 'BG', 'SAIL', '2026-09-15', NULL),
('FIT-208866', 'RQR-FIT-208866B2', 'HWH-NDLS-DN', 'ER', 'Howrah', 'Fish Plate', 'Carbon Steel', '2022-11-03', '2026-05-12', 'Under Maintenance', 22.5760, 88.3639, 'Howrah', 'HWH-KGP', 'BG', 'Tata Steel', '2026-08-01', NULL),
('FIT-300145', 'RQR-FIT-300145C3', 'MAS-BGL-UP', 'SR', 'Chennai Central', 'Sleeper', 'Prestressed Concrete', '2023-03-22', '2026-07-01', 'Active', 13.0827, 80.2707, 'Chennai', 'MAS-VMC', 'BG', 'IRCON', '2026-10-01', NULL),
('FIT-411290', 'RQR-FIT-411290D4', 'BCT-ADI-UP', 'WR', 'Mumbai Central', 'Rail Joint', 'Manganese Steel', '2022-08-14', '2026-04-18', 'Flagged', 18.9400, 72.8350, 'Mumbai', 'BCT-ADH', 'BG', 'JSW Steel', '2026-07-30', NULL),
('FIT-520374', 'RQR-FIT-520374E5', 'SBC-MAS-DN', 'SWR', 'Bengaluru', 'Switch Blade', 'Manganese Steel', '2023-05-10', '2026-06-05', 'Active', 12.9716, 77.5946, 'Bengaluru', 'SBC-JNR', 'BG', 'SAIL', '2026-09-10', NULL),
('FIT-630812', 'RQR-FIT-630812F6', 'HWH-NDLS-UP', 'ER', 'Asansol', 'Fish Plate', 'Carbon Steel', '2022-12-01', '2026-05-28', 'Active', 23.6889, 86.9661, 'Asansol', 'ASN-DHN', 'BG', 'Tata Steel', '2026-08-15', NULL),
('FIT-741503', 'RQR-FIT-741503G7', 'NDLS-JAT-UP', 'NR', 'Jammu Tawi', 'Sleeper', 'Prestressed Concrete', '2023-02-18', '2026-06-12', 'Active', 32.7266, 74.8570, 'Jammu', 'JAT-UDR', 'BG', 'IRCON', '2026-09-20', NULL),
('FIT-852940', 'RQR-FIT-852940H8', 'BBS-NDLS-DN', 'ECOR', 'Bhubaneswar', 'Rail Joint', 'Manganese Steel', '2022-09-25', '2026-03-15', 'Decommissioned', 20.2961, 85.8245, 'Bhubaneswar', 'BBS-KUR', 'BG', 'SAIL', NULL, NULL),
('FIT-963125', 'RQR-FIT-963125I9', 'SBC-SC-DN', 'SWR', 'Secunderabad', 'Switch Blade', 'Manganese Steel', '2023-04-05', '2026-07-10', 'Active', 17.4580, 78.5000, 'Secunderabad', 'SC-SCB', 'BG', 'JSW Steel', '2026-10-05', NULL),
('FIT-174830', 'RQR-FIT-174830J0', 'ADI-JU-UP', 'WR', 'Ahmedabad', 'Fish Plate', 'Carbon Steel', '2022-10-20', '2026-05-05', 'Active', 23.0225, 72.5714, 'Ahmedabad', 'ADI-MSH', 'BG', 'Tata Steel', '2026-08-20', NULL),
('FIT-285917', 'RQR-FIT-285917K1', 'MAS-TPJ-DN', 'SR', 'Tiruchirappalli', 'Sleeper', 'Prestressed Concrete', '2023-06-15', '2026-06-25', 'Active', 10.7905, 78.7047, 'Tiruchirappalli', 'TPJ-MDU', 'BG', 'IRCON', '2026-09-25', NULL),
('FIT-396240', 'RQR-FIT-396240L2', 'HWH-PURI-UP', 'ER', 'Kharagpur', 'Rail Joint', 'Manganese Steel', '2022-07-08', '2026-04-02', 'Flagged', 22.3460, 87.2319, 'Kharagpur', 'KGP-ADH', 'BG', 'SAIL', '2026-07-25', NULL),
('FIT-507358', 'RQR-FIT-507358M3', 'NDLS-HWH-DN', 'NR', 'Kanpur Central', 'Fish Plate', 'Carbon Steel', '2023-01-28', '2026-06-30', 'Active', 26.4499, 80.3319, 'Kanpur', 'CNB-ALD', 'BG', 'Tata Steel', '2026-09-05', NULL),
('FIT-618472', 'RQR-FIT-618472N4', 'BCT-PUNE-UP', 'WR', 'Pune', 'Switch Blade', 'Manganese Steel', '2022-11-18', '2026-05-20', 'Under Maintenance', 18.5204, 73.8567, 'Pune', 'PUNE-SRV', 'BG', 'JSW Steel', '2026-08-10', NULL),
('FIT-729580', 'RQR-FIT-729580O5', 'SBC-GTL-UP', 'SWR', 'Hubbali', 'Sleeper', 'Prestressed Concrete', '2023-03-08', '2026-06-18', 'Active', 15.3647, 75.1240, 'Hubbali', 'HBL-GTL', 'BG', 'IRCON', '2026-09-12', NULL),
('FIT-840693', 'RQR-FIT-840693P6', 'MAS-SBC-DN', 'SR', 'Bengaluru Cantonment', 'Rail Joint', 'Manganese Steel', '2022-08-30', '2026-03-28', 'Flagged', 12.9921, 77.5960, 'Bengaluru', 'BNC-SBC', 'BG', 'SAIL', '2026-07-28', NULL),
('FIT-951704', 'RQR-FIT-951704Q7', 'HWH-BBS-UP', 'ECOR', 'Cuttack', 'Fish Plate', 'Carbon Steel', '2023-05-25', '2026-07-05', 'Active', 20.4621, 85.5028, 'Cuttack', 'CTC-BBS', 'BG', 'Tata Steel', '2026-10-10', NULL),
('FIT-162815', 'RQR-FIT-162815R8', 'NDLS-BCT-UP', 'WR', 'Vadodara', 'Sleeper', 'Prestressed Concrete', '2022-12-12', '2026-05-15', 'Active', 22.3072, 73.1812, 'Vadodara', 'BRC-ADH', 'BG', 'IRCON', '2026-08-25', NULL),
('FIT-273926', 'RQR-FIT-273926S9', 'ADI-PBR-DN', 'WR', 'Rajkot', 'Switch Blade', 'Manganese Steel', '2023-02-05', '2026-06-08', 'Active', 22.3039, 70.8022, 'Rajkot', 'RJT-JMN', 'BG', 'JSW Steel', '2026-09-08', NULL),
('FIT-384037', 'RQR-FIT-384037T0', 'SBC-MYS-UP', 'SWR', 'Mysuru', 'Rail Joint', 'Manganese Steel', '2022-10-10', '2026-04-22', 'Under Maintenance', 12.2958, 76.6394, 'Mysuru', 'MYS-SBC', 'BG', 'SAIL', '2026-08-05', NULL)
ON CONFLICT (qr_id) DO NOTHING;

-- Insert inspections (mix of PASS and FAIL) with explicit created_at
INSERT INTO inspections (fit_id, qr_id, result, confidence, problems, inspector_id, created_at)
SELECT tf.id, tf.qr_id, 'PASS', 92.50, ARRAY['No significant defects detected'], p.id, '2026-06-20'
FROM track_fittings tf, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) p
WHERE tf.component_id IN ('FIT-100421','FIT-300145','FIT-520374','FIT-630812','FIT-741503','FIT-963125','FIT-174830','FIT-285917','FIT-507358','FIT-729580')
ON CONFLICT DO NOTHING;

INSERT INTO inspections (fit_id, qr_id, result, confidence, problems, inspector_id, created_at)
SELECT tf.id, tf.qr_id, 'FAIL', 78.30, ARRAY['Surface corrosion detected','Minor crack near rail joint'], p.id, '2026-04-18'
FROM track_fittings tf, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) p
WHERE tf.component_id IN ('FIT-411290','FIT-396240','FIT-840693')
ON CONFLICT DO NOTHING;

INSERT INTO inspections (fit_id, qr_id, result, confidence, problems, inspector_id, created_at)
SELECT tf.id, tf.qr_id, 'PASS', 88.75, ARRAY['Wear within acceptable limits'], p.id, '2026-07-05'
FROM track_fittings tf, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) p
WHERE tf.component_id IN ('FIT-951704','FIT-162815','FIT-273926')
ON CONFLICT DO NOTHING;

INSERT INTO inspections (fit_id, qr_id, result, confidence, problems, inspector_id, created_at)
SELECT tf.id, tf.qr_id, 'FAIL', 65.20, ARRAY['Excessive wear on switch blade','Alignment deviation detected'], p.id, '2026-04-22'
FROM track_fittings tf, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) p
WHERE tf.component_id IN ('FIT-384037')
ON CONFLICT DO NOTHING;

-- Insert maintenance logs
INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-08-01', NULL, 'Corrective', 'Replace corroded fish plate assembly', 'Scheduled', 'High', NULL
FROM track_fittings tf WHERE tf.component_id = 'FIT-208866'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-08-10', NULL, 'Preventive', 'Routine switch blade adjustment and lubrication', 'Scheduled', 'Medium', NULL
FROM track_fittings tf WHERE tf.component_id = 'FIT-618472'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-08-05', NULL, 'Corrective', 'Replace worn rail joint section', 'In Progress', 'Critical', NULL
FROM track_fittings tf WHERE tf.component_id = 'FIT-384037'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-07-25', NULL, 'Emergency', 'Address flagged alignment deviation', 'Overdue', 'Critical', NULL
FROM track_fittings tf WHERE tf.component_id = 'FIT-396240'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-06-20', '2026-06-20', 'Routine', 'Monthly inspection and cleaning', 'Completed', 'Low', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
FROM track_fittings tf WHERE tf.component_id = 'FIT-100421'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-06-05', '2026-06-05', 'Routine', 'Quarterly sleeper inspection', 'Completed', 'Low', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
FROM track_fittings tf WHERE tf.component_id = 'FIT-520374'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-09-15', NULL, 'Preventive', 'Scheduled quarterly maintenance', 'Scheduled', 'Medium', NULL
FROM track_fittings tf WHERE tf.component_id = 'FIT-100421'
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (fit_id, qr_id, scheduled_date, completed_date, type, notes, status, priority, performed_by)
SELECT tf.id, tf.qr_id, '2026-10-01', NULL, 'Preventive', 'Bi-annual sleeper replacement check', 'Scheduled', 'Low', NULL
FROM track_fittings tf WHERE tf.component_id = 'FIT-300145'
ON CONFLICT DO NOTHING;

-- Insert complaints
INSERT INTO complaints (fit_id, qr_id, complaint_type, priority, description, status, registered_by, created_at, updated_at)
SELECT tf.id, tf.qr_id, 'Corrosion', 'High', 'Surface corrosion observed on fish plate at Howrah junction, requires immediate attention', 'In Progress', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), '2026-07-15', '2026-07-20'
FROM track_fittings tf WHERE tf.component_id = 'FIT-208866'
ON CONFLICT DO NOTHING;

INSERT INTO complaints (fit_id, qr_id, complaint_type, priority, description, status, registered_by, created_at, updated_at)
SELECT tf.id, tf.qr_id, 'Crack', 'Critical', 'Visible crack detected near rail joint during routine inspection at Mumbai Central', 'Open', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), '2026-07-18', '2026-07-18'
FROM track_fittings tf WHERE tf.component_id = 'FIT-411290'
ON CONFLICT DO NOTHING;

INSERT INTO complaints (fit_id, qr_id, complaint_type, priority, description, status, registered_by, created_at, updated_at)
SELECT tf.id, tf.qr_id, 'Alignment', 'High', 'Switch blade alignment deviation exceeding tolerance at Kharagpur section', 'Open', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), '2026-07-22', '2026-07-22'
FROM track_fittings tf WHERE tf.component_id = 'FIT-396240'
ON CONFLICT DO NOTHING;

INSERT INTO complaints (fit_id, qr_id, complaint_type, priority, description, status, registered_by, created_at, updated_at)
SELECT tf.id, tf.qr_id, 'Wear', 'Medium', 'Excessive wear on switch blade at Mysuru section, recommend replacement', 'Resolved', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), '2026-06-10', '2026-07-05'
FROM track_fittings tf WHERE tf.component_id = 'FIT-384037'
ON CONFLICT DO NOTHING;

INSERT INTO complaints (fit_id, qr_id, complaint_type, priority, description, status, registered_by, created_at, updated_at)
SELECT tf.id, tf.qr_id, 'Loose Fastening', 'Low', 'Loose fastening detected on sleeper at Tiruchirappalli, scheduled for tightening', 'Resolved', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), '2026-05-20', '2026-06-01'
FROM track_fittings tf WHERE tf.component_id = 'FIT-285917'
ON CONFLICT DO NOTHING;

-- Insert notifications
INSERT INTO notifications (type, title, message, fit_id, read, created_at)
SELECT 'failed_inspection', 'Inspection Failed', 'AI inspection flagged FIT-411290 for surface corrosion and crack', tf.id, false, '2026-07-18'
FROM track_fittings tf WHERE tf.component_id = 'FIT-411290'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (type, title, message, fit_id, read, created_at)
SELECT 'maintenance_due', 'Maintenance Overdue', 'Emergency maintenance for FIT-396240 is overdue by 1 day', tf.id, false, '2026-07-25'
FROM track_fittings tf WHERE tf.component_id = 'FIT-396240'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (type, title, message, fit_id, read, created_at)
SELECT 'failed_inspection', 'Inspection Failed', 'AI inspection detected excessive wear on FIT-384037 switch blade', tf.id, true, '2026-07-10'
FROM track_fittings tf WHERE tf.component_id = 'FIT-384037'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (type, title, message, fit_id, read, created_at)
SELECT 'maintenance_due', 'Maintenance Scheduled', 'Corrective maintenance scheduled for FIT-208866 on 2026-08-01', tf.id, true, '2026-07-20'
FROM track_fittings tf WHERE tf.component_id = 'FIT-208866'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (type, title, message, fit_id, read, created_at)
SELECT 'general', 'New Component Registered', 'Track fitting FIT-951704 has been added to the system', tf.id, true, '2026-05-25'
FROM track_fittings tf WHERE tf.component_id = 'FIT-951704'
ON CONFLICT DO NOTHING;

-- Insert laser marking records
INSERT INTO laser_markings (fit_id, qr_id, laser_power, temperature, speed, material, estimated_time, status, started_by, created_at)
SELECT tf.id, tf.qr_id, 20, 25.00, 100, tf.material, 45, 'Completed', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), tf.installation_date
FROM track_fittings tf WHERE tf.component_id IN ('FIT-100421','FIT-300145','FIT-520374','FIT-741503','FIT-963125')
ON CONFLICT DO NOTHING;

INSERT INTO laser_markings (fit_id, qr_id, laser_power, temperature, speed, material, estimated_time, status, started_by, created_at)
SELECT tf.id, tf.qr_id, 25, 28.50, 90, tf.material, 52, 'Completed', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), tf.installation_date
FROM track_fittings tf WHERE tf.component_id IN ('FIT-174830','FIT-285917','FIT-507358','FIT-729580','FIT-951704')
ON CONFLICT DO NOTHING;

-- Insert audit logs
INSERT INTO audit_logs (user_id, action, entity, entity_id, details, created_at)
SELECT id, 'CREATE', 'track_fitting', 'FIT-100421', 'Registered new track fitting at New Delhi station', '2023-01-15'
FROM profiles WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (user_id, action, entity, entity_id, details, created_at)
SELECT id, 'INSPECT', 'track_fitting', 'FIT-411290', 'AI inspection failed - corrosion detected', '2026-07-18'
FROM profiles WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (user_id, action, entity, entity_id, details, created_at)
SELECT id, 'UPDATE', 'track_fitting', 'FIT-208866', 'Status changed to Under Maintenance', '2026-07-20'
FROM profiles WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (user_id, action, entity, entity_id, details, created_at)
SELECT id, 'CREATE', 'complaint', 'FIT-411290', 'New complaint registered: Crack detected', '2026-07-18'
FROM profiles WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (user_id, action, entity, entity_id, details, created_at)
SELECT id, 'SCHEDULE', 'maintenance', 'FIT-396240', 'Emergency maintenance scheduled', '2026-07-22'
FROM profiles WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;
