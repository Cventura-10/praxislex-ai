-- ============================================================================
-- PRAXIS LEX v3.2 - Seed Datos Geográficos República Dominicana
-- ============================================================================

-- Insertar Provincias (32 provincias + Distrito Nacional)
INSERT INTO public.provincias (id, nombre) VALUES
(1, 'Distrito Nacional'),
(2, 'Azua'),
(3, 'Baoruco'),
(4, 'Barahona'),
(5, 'Dajabón'),
(6, 'Duarte'),
(7, 'Elías Piña'),
(8, 'El Seibo'),
(9, 'Espaillat'),
(10, 'Independencia'),
(11, 'La Altagracia'),
(12, 'La Romana'),
(13, 'La Vega'),
(14, 'María Trinidad Sánchez'),
(15, 'Montecristi'),
(16, 'Monte Plata'),
(17, 'Pedernales'),
(18, 'Peravia'),
(19, 'Puerto Plata'),
(20, 'Hermanas Mirabal'),
(21, 'Samaná'),
(22, 'San Cristóbal'),
(23, 'San José de Ocoa'),
(24, 'San Juan'),
(25, 'San Pedro de Macorís'),
(26, 'Sánchez Ramírez'),
(27, 'Santiago'),
(28, 'Santiago Rodríguez'),
(29, 'Valverde'),
(30, 'Monseñor Nouel'),
(31, 'Hato Mayor'),
(32, 'Santo Domingo')
ON CONFLICT (id) DO NOTHING;

-- Insertar Municipios principales por provincia
INSERT INTO public.municipios (provincia_id, nombre) VALUES
-- Distrito Nacional
(1, 'Santo Domingo de Guzmán'),
-- Santo Domingo
(32, 'Santo Domingo Este'),
(32, 'Santo Domingo Norte'),
(32, 'Santo Domingo Oeste'),
(32, 'Boca Chica'),
(32, 'Los Alcarrizos'),
(32, 'Pedro Brand'),
(32, 'San Antonio de Guerra'),
-- Santiago
(27, 'Santiago'),
(27, 'Licey al Medio'),
(27, 'Tamboril'),
(27, 'Villa Bisonó'),
(27, 'San José de las Matas'),
(27, 'Sabana Iglesia'),
(27, 'Jánico'),
(27, 'Puñal'),
(27, 'Villa González'),
-- La Vega
(13, 'La Vega'),
(13, 'Constanza'),
(13, 'Jarabacoa'),
(13, 'Jima Abajo'),
-- San Cristóbal
(22, 'San Cristóbal'),
(22, 'Villa Altagracia'),
(22, 'Yaguate'),
(22, 'Bajos de Haina'),
(22, 'Cambita Garabitos'),
-- Puerto Plata
(19, 'Puerto Plata'),
(19, 'Sosúa'),
(19, 'Cabarete'),
(19, 'Luperón'),
-- La Romana
(12, 'La Romana'),
-- San Pedro de Macorís
(25, 'San Pedro de Macorís'),
(25, 'Los Llanos'),
(25, 'Ramón Santana'),
-- La Altagracia
(11, 'Higüey'),
(11, 'Punta Cana'),
(11, 'San Rafael del Yuma'),
-- Duarte
(6, 'San Francisco de Macorís'),
(6, 'Arenoso'),
(6, 'Castillo'),
-- Espaillat
(9, 'Moca'),
(9, 'Cayetano Germosén'),
(9, 'Gaspar Hernández'),
-- Barahona
(4, 'Barahona'),
(4, 'Cabral'),
(4, 'Enriquillo'),
-- Azua
(2, 'Azua'),
(2, 'Las Charcas'),
-- Monseñor Nouel
(30, 'Bonao'),
(30, 'Maimón'),
-- Samaná
(21, 'Samaná'),
(21, 'Las Terrenas'),
(21, 'Sánchez')
ON CONFLICT DO NOTHING;

-- Insertar Sectores/Barrios principales (ejemplos para ciudades principales)
INSERT INTO public.sectores (municipio_id, nombre) VALUES
-- Santo Domingo de Guzmán
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'Zona Colonial'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'Gazcue'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'Naco'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'Piantini'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'Bella Vista'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'La Esperilla'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'La Julia'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo de Guzmán' LIMIT 1), 'Los Prados'),
-- Santo Domingo Este
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo Este' LIMIT 1), 'Los Mina'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo Este' LIMIT 1), 'Villa Faro'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo Este' LIMIT 1), 'Alma Rosa'),
((SELECT id FROM public.municipios WHERE nombre = 'Santo Domingo Este' LIMIT 1), 'Mendoza'),
-- Santiago
((SELECT id FROM public.municipios WHERE nombre = 'Santiago' LIMIT 1), 'Centro'),
((SELECT id FROM public.municipios WHERE nombre = 'Santiago' LIMIT 1), 'Los Jardines Metropolitanos'),
((SELECT id FROM public.municipios WHERE nombre = 'Santiago' LIMIT 1), 'Gurabo'),
((SELECT id FROM public.municipios WHERE nombre = 'Santiago' LIMIT 1), 'Cienfuegos'),
((SELECT id FROM public.municipios WHERE nombre = 'Santiago' LIMIT 1), 'La Otra Banda'),
-- La Vega
((SELECT id FROM public.municipios WHERE nombre = 'La Vega' LIMIT 1), 'Centro'),
((SELECT id FROM public.municipios WHERE nombre = 'La Vega' LIMIT 1), 'Rincón'),
-- Puerto Plata
((SELECT id FROM public.municipios WHERE nombre = 'Puerto Plata' LIMIT 1), 'Centro'),
((SELECT id FROM public.municipios WHERE nombre = 'Puerto Plata' LIMIT 1), 'Playa Dorada'),
-- San Cristóbal
((SELECT id FROM public.municipios WHERE nombre = 'San Cristóbal' LIMIT 1), 'Centro'),
((SELECT id FROM public.municipios WHERE nombre = 'San Cristóbal' LIMIT 1), 'Villa Fundación')
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
DO $$
DECLARE
  v_provincias INT;
  v_municipios INT;
  v_sectores INT;
BEGIN
  SELECT COUNT(*) INTO v_provincias FROM public.provincias;
  SELECT COUNT(*) INTO v_municipios FROM public.municipios;
  SELECT COUNT(*) INTO v_sectores FROM public.sectores;
  
  RAISE NOTICE '✅ Seed geográfico completado:';
  RAISE NOTICE '   - % provincias', v_provincias;
  RAISE NOTICE '   - % municipios', v_municipios;
  RAISE NOTICE '   - % sectores', v_sectores;
END $$;