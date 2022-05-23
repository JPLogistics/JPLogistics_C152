export const xmlConfig = `
<EngineDisplay>
	<Function Name="TorqueRedLine">
		<If>
			<Condition>
				<Lower>
					<Simvar name="PROP RPM:1" unit="rpm"/>
					<Constant>1800</Constant>
				</Lower>
			</Condition>
			<Then>
				<Constant>2397</Constant>
			</Then>
			<Else>
				<If>
					<Condition>
						<Lower>
							<Simvar name="PLANE ALTITUDE" unit="feet"/>
							<Constant>16000</Constant>
						</Lower>
					</Condition>
					<Then>
						<MultiDimensionsTable>
							<Input>
								<!-- Altitude Indexes -->
								<!-- 		 0,   1,   2,   3,   4,    5,    6,    7,    8 -->
								<References> 0,2000,4000,6000,8000,10000,12000,14000,16000</References>
								<Param>
									<Simvar name="PLANE ALTITUDE" unit="feet"/>
								</Param>
							</Input>
							<Input>
								<!-- Temperature Indexes -->
								<!-- 		  0,  1,  2,  3,  4,  5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22 -->
								<References>-54,-40,-36,-22,-20,-18,-10,-8,-4, 0,  2,  4, 14, 18, 22, 26, 30, 32, 34, 38, 42, 46, 50</References>
								<Param>
									<Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
								</Param>
							</Input>
							<!-- AltitudeIndex, TemperatureIndex : Value; -->
							<Output>
									0,0:2397;0,17:2397;0,22:2020;
									1,0:2397;1,14:2397;1,21:1940;
									2,0:2397;2,12:2397;2,20:1860;
									3,0:2397;3,10:2397;3,19:1780;
									4,0:2397;4,7:2397;4,9:2240;4,18:1700;
									5,0:2397;5,3:2397;5,8:2120;5,11:2000;5,16:1620;
									6,0:2397;6,1:2397;6,4:2170;6,15:1540;
									7,0:2360;7,2:2140;7,5:1960;7,6:1880;7,14:1440;
									8,0:2160;8,1:2000;8,5:1800;8,6:1720;8,13:1360;
							</Output>
						</MultiDimensionsTable>
					</Then>
					<Else>
						<MultiDimensionsTable>
							<Input>
								<!-- Altitude Indexes -->
								<!-- 			0,    1,    2,    3,    4 -->
								<References>16000,18000,20000,22000,24000</References>
								<Param>
									<Simvar name="PLANE ALTITUDE" unit="feet"/>
								</Param>
							</Input>
							<Input>
								<!-- Temperature Indexes -->
								<!-- 		  0,  1,  2,  3,  4,  5,  6,  7, 8, 9, 10, 11, 12, 13, 14, 15 -->
								<References>-54,-42,-40,-32,-30,-28,-22,-14,-4,-2,  0,  2,  6, 10, 14, 18</References>
								<Param>
									<Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
								</Param>
							</Input>
							<!-- AltitudeIndex, TemperatureIndex : Value; -->
							<Output>
									0,0:2110;0,2:1950;0,4:1850;0,6:1760;0,7:1660;0,9:1520;0,15:1260;
									1,0:1940;1,2:1780;1,3:1715;1,9:1395;1,14:1190;
									2,0:1770;2,2:1630;2,4:1550;2,10:1250;2,13:1130;
									3,0:1620;3,2:1490;3,5:1400;3,10:1140;3,12:1070;
									4,0:1480;4,1:1380;4,4:1295;4,6:1235;4,7:1160;4,8:1085;4,11:1000;
							</Output>
						</MultiDimensionsTable>
					</Else>
				</If>
			</Else>
		</If>
	</Function>

	<Function Name="MaximumCruiseTorqueBug">
		<MultiDimensionsTable>
			<Input>
				<!-- Temperature Indexes -->
				<!--          0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21 -->
				<References>-54,-50,-45,-40,-35,-30,-25,-20,-15,-10, -5,  0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50</References>
				<Param>
					<Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
				</Param>
			</Input>
			<Input>
				<!-- Altitude Indexes -->
				<!-- 		   0,   1,   2,   3,   4,   5,   6,   7,   8,    9,   10,   11,   12,   13,   14,   15,   16,   17,   18,   19,   20,   21,   22,   23 -->
				<References>1000,2000,3000,4000,5000,6000,7000,8000,9000,10000,11000,12000,13000,14000,15000,16000,17000,18000,19000,20000,21000,22000,23000,24000</References>
				<Param>
					<Simvar name="PLANE ALTITUDE" unit="feet"/>
				</Param>
			</Input>
			<Input>
				<!-- PropRpm Indexes -->
				<!--   		   0,    1,    2 -->
				<References>1600, 1750, 1900</References>
				<Param>
					<Simvar name="PROP RPM:1" unit="rpm"/>
				</Param>
			</Input>
			<!-- TemperatureIndex, AltitudeIndex, PropRpmIndex : Value; -->
			<Output>
					21,0,2:1369;21,0,1:1508;21,0,0:1638;21,1,2:1318;21,1,1:1452;21,1,0:1577;21,2,2:1268;21,2,1:1397;21,2,0:1517;
					20,0,2:1498;20,0,1:1645;20,0,0:1773;20,1,2:1442;20,1,1:1585;20,1,0:1707;20,2,2:1388;20,2,1:1525;20,2,0:1644;20,3,2:1336;20,3,1:1468;20,3,0:1582;20,4,2:1284;20,4,1:1411;20,4,0:1521;20,5,2:1231;20,5,1:1353;20,5,0:1458;
					19,0,2:1644;19,0,1:1803;19,0,0:1927;19,1,2:1584;19,1,1:1737;19,1,0:1857;19,2,2:1525;19,2,1:1672;19,2,0:1787;19,3,2:1468;19,3,1:1610;19,3,0:1724;19,4,2:1411;19,4,1:1553;19,4,0:1656;19,5,2:1354;19,5,1:1486;19,5,0:1584;19,6,2:1293;19,6,1:1419;19,6,0:1517;19,7,2:1238;19,7,1:1359;19,7,0:1454;19,8,2:1186;19,8,1:1302;19,8,0:1393;
					18,0,2:1780;18,0,1:1945;18,0,0:2064;18,1,2:1723;18,1,1:1882;18,1,0:1996;18,2,2:1663;18,2,1:1816;18,2,0:1926;18,3,2:1601;18,3,1:1748;18,3,0:1854;18,4,2:1540;18,4,1:1682;18,4,0:1784;18,5,2:1473;18,5,1:1610;18,5,0:1708;18,6,2:1410;18,6,1:1542;18,6,0:1636;18,7,2:1350;18,7,1:1477;18,7,0:1566;18,8,2:1293;18,8,1:1414;18,8,0:1502;
					17,0,2:1910;17,0,1:2082;17,0,0:2185;17,1,2:1847;17,1,1:2013;17,1,0:2109;17,2,2:1787;17,2,1:1945;17,2,0:2036;17,3,2:1729;17,3,1:1880;17,3,0:1966;17,4,2:1674;17,4,1:1816;17,4,0:1897;17,5,2:1600;17,5,1:1739;17,5,0:1818;17,6,2:1529;17,6,1:1662;17,6,0:1742;17,7,2:1463;17,7,1:1596;17,7,0:1668;17,8,2:1399;17,8,1:1526;17,8,0:1598;17,9,2:1339;17,9,1:1460;17,9,0:1531;17,10,2:1272;17,10,1:1388;17,10,0:1461;17,11,2:1207;17,11,1:1318;17,11,0:1392;
					16,0,2:2036;16,0,1:2198;16,0,0:2289;16,1,2:1960;16,1,1:2117;16,1,0:2204;16,2,2:1890;16,2,1:2041;16,2,0:2124;16,3,2:1825;16,3,1:1970;16,3,0:2051;16,4,2:1762;16,4,1:1902;16,4,0:1978;16,5,2:1694;16,5,1:1829;16,5,0:1901;16,6,2:1628;16,6,1:1757;16,6,0:1826;16,7,2:1561;16,7,1:1686;16,7,0:1752;16,8,2:1494;16,8,1:1614;16,8,0:1677;16,9,2:1432;16,9,1:1545;16,9,0:1606;16,10,2:1363;16,10,1:1473;16,10,0:1533;16,11,2:1298;16,11,1:1399;16,11,0:1461;16,12,2:1235;16,12,1:1336;16,12,0:1392;16,13,2:1174;16,13,1:1270;16,13,0:1326;16,14,2:1115;16,14,1:1207;16,14,0:1261;
					15,0,2:2150;15,0,1:2319;15,0,0:2397;15,1,2:2070;15,1,1:2233;15,1,0:2309;15,2,2:1993;15,2,1:2149;15,2,0:2225;15,3,2:1919;15,3,1:2069;15,3,0:2140;15,4,2:1846;15,4,1:1991;15,4,0:2061;15,5,2:1775;15,5,1:1914;15,5,0:1981;15,6,2:1706;15,6,1:1840;15,6,0:1903;15,7,2:1639;15,7,1:1767;15,7,0:1828;15,8,2:1574;15,8,1:1697;15,8,0:1755;15,9,2:1512;15,9,1:1629;15,9,0:1684;15,10,2:1441;15,10,1:1554;15,10,0:1608;15,11,2:1373;15,11,1:1481;15,11,0:1533;15,12,2:1309;15,12,1:1141;15,12,0:1462;15,13,2:1244;15,13,1:1342;15,13,0:1392;15,14,2:1182;15,14,1:1277;15,14,0:1325;15,15,2:1125;15,15,1:1215;15,15,0:1261;15,16,2:1069;15,16,1:1155;15,16,0:1199;15,17,2:1016;15,17,1:1097;15,17,0:1396;
					14,0,2:2160;14,0,1:2350;14,0,0:2397;14,1,2:2186;14,1,1:2353;14,1,0:2397;14,2,2:2104;14,2,1:2265;14,2,0:2328;14,3,2:2025;14,3,1:2180;14,3,0:2240;14,4,2:1948;14,4,1:2097;14,4,0:2155;14,5,2:1869;14,5,1:2012;14,5,0:2068;14,6,2:1791;14,6,1:1927;14,6,0:1984;14,7,2:1718;14,7,1:1851;14,7,0:1903;14,8,2:1650;14,8,1:1777;14,8,0:1827;14,9,2:1584;14,9,1:1705;14,9,0:1753;14,10,2:1515;14,10,1:1631;14,10,0:1678;14,11,2:1448;14,11,1:1560;14,11,0:1605;14,12,2:1382;14,12,1:1489;14,12,0:1533;14,13,2:1315;14,13,1:1417;14,13,0:1461;14,14,2:1251;14,14,1:1349;14,14,0:1392;14,15,2:1190;14,15,1:1284;14,15,0:1324;14,16,2:1132;14,16,1:1221;14,16,0:1260;14,17,2:1076;14,17,1:1160;14,17,0:1197;
					13,0,2:2140;13,0,1:2330;13,0,0:2397;13,1,2:2176;13,1,1:2371;13,1,0:2397;13,2,2:2215;13,2,1:2377;13,2,0:2397;13,3,2:2133;13,3,1:2288;13,3,0:2336;13,4,2:2052;13,4,1:2201;13,4,0:2247;13,5,2:1969;13,5,1:2112;13,5,0:2157;13,6,2:1889;13,6,1:2026;13,6,0:2070;13,7,2:1810;13,7,1:1942;13,7,0:1984;13,8,2:1733;13,8,1:1860;13,8,0:1901;13,9,2:1658;13,9,1:1780;13,9,0:1821;13,10,2:1586;13,10,1:1703;13,10,0:1742;13,11,2:1517;13,11,1:1629;13,11,0:1666;13,12,2:1450;13,12,1:1557;13,12,0:1593;13,13,2:1385;13,13,1:1488;13,13,0:1522;13,14,2:1322;13,14,1:1420;13,14,0:1455;13,15,2:1258;13,15,1:1352;13,15,0:1385;13,16,2:1196;13,16,1:1286;13,16,0:1319;13,17,2:1137;13,17,1:1223;13,17,0:1254;
					12,0,2:2122;12,0,1:2307;12,0,0:2397;12,1,2:2155;12,1,1:2348;12,1,0:2397;12,2,2:2192;12,2,1:2389;12,2,0:2397;12,3,2:2232;12,3,1:2397;12,3,0:2397;12,4,2:2159;12,4,1:2309;12,4,0:2342;12,5,2:2073;12,5,1:2217;12,5,0:2249;12,6,2:1989;12,6,1:2127;12,6,0:2158;12,7,2:1907;12,7,1:2040;12,7,0:2070;12,8,2:1827;12,8,1:1955;12,8,0:1984;12,9,2:1749;12,9,1:1872;12,9,0:1901;12,10,2:1668;12,10,1:1785;12,10,0:1815;12,11,2:1590;12,11,1:1703;12,11,0:1732;12,12,2:1517;12,12,1:1623;12,12,0:1655;12,13,2:1449;12,13,1:1551;12,13,0:1582;12,14,2:1383;12,14,1:1483;12,14,0:1510;12,15,2:1320;12,15,1:1415;12,15,0:1441;12,16,2:1258;12,16,1:1349;12,16,0:1375;12,17,2:1198;12,17,1:1284;12,17,0:1309;
					11,0,2:2104;11,0,1:2285;11,0,0:2397;11,1,2:2137;11,1,1:2327;11,1,0:2397;11,2,2:2171;11,2,1:2367;11,2,0:2397;11,3,2:2209;11,3,1:2397;11,3,0:2397;11,4,2:2251;11,4,1:2397;11,4,0:2397;11,5,2:2184;11,5,1:2326;11,5,0:2342;11,6,2:2093;11,6,1:2231;11,6,0:2247;11,7,2:2011;11,7,1:2140;11,7,0:2156;11,8,2:1925;11,8,1:2052;11,8,0:2067;11,9,2:1844;11,9,1:1966;11,9,0:1981;11,10,2:1758;11,10,1:1877;11,10,0:1893;11,11,2:1675;11,11,1:1789;11,11,0:1807;11,12,2:1597;11,12,1:1704;11,12,0:1727;11,13,2:1521;11,13,1:1625;11,13,0:1645;11,14,2:1448;11,14,1:1548;11,14,0:1569;11,15,2:1382;11,15,1:1477;11,15,0:1497;11,16,2:1318;11,16,1:1409;11,16,0:1429;11,17,2:1256;11,17,1:1343;11,17,0:1362;
					10,0,2:2085;10,0,1:2264;10,0,0:2397;10,1,2:2118;10,1,1:2304;10,1,0:2397;10,2,2:2151;10,2,1:2345;10,2,0:2397;10,3,2:2188;10,3,1:2385;10,3,0:2397;10,4,2:2227;10,4,1:2397;10,4,0:2397;10,5,2:2269;10,5,1:2397;10,5,0:2397;10,6,2:2199;10,6,1:2335;10,6,0:2334;10,7,2:2109;10,7,1:2239;10,7,0:2238;10,8,2:2022;10,8,1:2148;10,8,0:2150;10,9,2:1938;10,9,1:2059;10,9,0:2060;10,10,2:1848;10,10,1:1965;10,10,0:1968;10,11,2:1762;10,11,1:1874;10,11,0:1880;10,12,2:1680;10,12,1:1787;10,12,0:1795;10,13,2:1600;10,13,1:1704;10,13,0:1713;10,14,2:1524;10,14,1:1624;10,14,0:1634;10,15,2:1452;10,15,1:1547;10,15,0:1558;10,16,2:1382;10,16,1:1473;10,16,0:1484;10,17,2:1315;10,17,1:1403;10,17,0:1414;10,18,2:1253;10,18,1:1336;10,18,0:1348;10,19,2:1193;10,19,1:1272;10,19,0:1283;10,20,2:1133;10,20,1:1209;10,20,0:1219;
					9,0,2:2066;9,0,1:2242;9,0,0:2397;9,1,2:2099;9,1,1:2281;9,1,0:2397;9,2,2:2134;9,2,1:2321;9,2,0:2397;9,3,2:2167;9,3,1:2363;9,3,0:2397;9,4,2:2206;9,4,1:2397;9,4,0:2397;9,5,2:2244;9,5,1:2397;9,5,0:2397;9,6,2:2286;9,6,1:2397;9,6,0:2397;9,7,2:2206;9,7,1:2331;9,7,0:2316;9,8,2:2115;9,8,1:2236;9,8,0:2221;9,9,2:2027;9,9,1:2143;9,9,0:2130;9,10,2:1936;9,10,1:2048;9,10,0:2037;9,11,2:1847;9,11,1:1955;9,11,0:1946;9,12,2:1761;9,12,1:1866;9,12,0:1859;9,13,2:1680;9,13,1:1780;9,13,0:1775;9,14,2:1601;9,14,1:1698;9,14,0:1695;9,15,2:1526;9,15,1:1620;9,15,0:1618;9,16,2:1453;9,16,1:1544;9,16,0:1543;9,17,2:1383;9,17,1:1470;9,17,0:1471;9,18,2:1315;9,18,1:1398;9,18,0:1401;9,19,2:1249;9,19,1:1327;9,19,0:1333;9,20,2:1187;9,20,1:1264;9,20,0:1269;
					8,0,2:2047;8,0,1:2219;8,0,0:2397;8,1,2:2080;8,1,1:2258;8,1,0:2397;8,2,2:2114;8,2,1:2298;8,2,0:2397;8,3,2:2148;8,3,1:2339;8,3,0:2397;8,4,2:2184;8,4,1:2380;8,4,0:2397;8,5,2:2222;8,5,1:2397;8,5,0:2397;8,6,2:2262;8,6,1:2397;8,6,0:2397;8,7,2:2301;8,7,1:2397;8,7,0:2392;8,8,2:2203;8,8,1:2323;8,8,0:2295;8,9,2:2116;8,9,1:2224;8,9,0:2200;8,10,2:2020;8,10,1:2130;8,10,0:2104;8,11,2:1931;8,11,1:2034;8,11,0:2012;8,12,2:1840;8,12,1:1942;8,12,0:1922;8,13,2:1754;8,13,1:1852;8,13,0:1836;8,14,2:1671;8,14,1:1766;8,14,0:1752;8,15,2:1593;8,15,1:1684;8,15,0:1673;8,16,2:1518;8,16,1:1606;8,16,0:1596;8,17,2:1446;8,17,1:1530;8,17,0:1522;8,18,2:1377;8,18,1:1457;8,18,0:1450;8,19,2:1309;8,19,1:1386;8,19,0:1381;8,20,2:1244;8,20,1:1318;8,20,0:1313;8,21,2:1180;8,21,1:1251;8,21,0:1247;8,22,2:1122;8,22,1:1191;8,22,0:1186;8,23,2:1065;8,23,1:1129;8,23,0:1116;
					7,0,2:2027;7,0,1:2197;7,0,0:2397;7,1,2:2061;7,1,1:2236;7,1,0:2397;7,2,2:2095;7,2,1:2274;7,2,0:2397;7,3,2:2128;7,3,1:2316;7,3,0:2397;7,4,2:2163;7,4,1:2356;7,4,0:2397;7,5,2:2200;7,5,1:2397;7,5,0:2397;7,6,2:2239;7,6,1:2397;7,6,0:2397;7,7,2:2278;7,7,1:2397;7,7,0:2397;7,8,2:2296;7,8,1:2397;7,8,0:2371;7,9,2:2199;7,9,1:2310;7,9,0:2271;7,10,2:2103;7,10,1:2209;7,10,0:2173;7,11,2:2009;7,11,1:2111;7,11,0:2078;7,12,2:1918;7,12,1:2016;7,12,0:1986;7,13,2:1829;7,13,1:1925;7,13,0:1897;7,14,2:1744;7,14,1:1836;7,14,0:1811;7,15,2:1662;7,15,1:1751;7,15,0:1728;7,16,2:1584;7,16,1:1669;7,16,0:1648;7,17,2:1507;7,17,1:1590;7,17,0:1572;7,18,2:1436;7,18,1:1515;7,18,0:1498;7,19,2:1367;7,19,1:1442;7,19,0:1427;7,20,2:1299;7,20,1:1371;7,20,0:1358;7,21,2:1234;7,21,1:1303;7,21,0:1290;7,22,2:1173;7,22,1:1240;7,22,0:1228;7,23,2:1112;7,23,1:1175;7,23,0:1160;
					6,0,2:2010;6,0,1:2175;6,0,0:2388;6,1,2:2041;6,1,1:2213;6,1,0:2397;6,2,2:2075;6,2,1:2251;6,2,0:2397;6,3,2:2109;6,3,1:2291;6,3,0:2397;6,4,2:2142;6,4,1:2332;6,4,0:2397;6,5,2:2178;6,5,1:2373;6,5,0:2397;6,6,2:2216;6,6,1:2397;6,6,0:2397;6,7,2:2255;6,7,1:2397;6,7,0:2397;6,8,2:2298;6,8,1:2397;6,8,0:2397;6,9,2:2295;6,9,1:2397;6,9,0:2362;6,10,2:2193;6,10,1:2296;6,10,0:2258;6,11,2:2095;6,11,1:2194;6,11,0:2156;6,12,2:2000;6,12,1:2096;6,12,0:2058;6,13,2:1909;6,13,1:2001;6,13,0:1963;6,14,2:1820;6,14,1:1910;6,14,0:1874;6,15,2:1734;6,15,1:1821;6,15,0:1788;6,16,2:1652;6,16,1:1736;6,16,0:1706;6,17,2:1574;6,17,1:1654;6,17,0:1626;6,18,2:1497;6,18,1:1574;6,18,0:1549;6,19,2:1424;6,19,1:1498;6,19,0:1475;6,20,2:1353;6,20,1:1424;6,20,0:1403;6,21,2:1285;6,21,1:1353;6,21,0:1334;6,22,2:1222;6,22,1:1287;6,22,0:1269;6,23,2:1159;6,23,1:1222;6,23,0:1204;
					5,0,2:1993;5,0,1:2154;5,0,0:2363;5,1,2:2021;5,1,1:2190;5,1,0:2397;5,2,2:2055;5,2,1:2227;5,2,0:2397;5,3,2:2089;5,3,1:2267;5,3,0:2397;5,4,2:2123;5,4,1:2308;5,4,0:2397;5,5,2:2158;5,5,1:2348;5,5,0:2397;5,6,2:2196;5,6,1:2389;5,6,0:2397;5,7,2:2236;5,7,1:2397;5,7,0:2397;5,8,2:2276;5,8,1:2397;5,8,0:2396;5,9,2:2318;5,9,1:2397;5,9,0:2397;5,10,2:2276;5,10,1:2371;5,10,0:2340;5,11,2:2177;5,11,1:2269;5,11,0:2238;5,12,2:2081;5,12,1:2170;5,12,0:2138;5,13,2:1988;5,13,1:2074;5,13,0:2042;5,14,2:1899;5,14,1:1982;5,14,0:1950;5,15,2:1813;5,15,1:1892;5,15,0:1859;5,16,2:1728;5,16,1:1806;5,16,0:1774;5,17,2:1646;5,17,1:1723;5,17,0:1690;5,18,2:1567;5,18,1:1641;5,18,0:1609;5,19,2:1490;5,19,1:1562;5,19,0:1531;5,20,2:1415;5,20,1:1484;5,20,0:1455;5,21,2:1342;5,21,1:1409;5,21,0:1382;5,22,2:1275;5,22,1:1339;5,22,0:1315;5,23,2:1210;5,23,1:1272;5,23,0:1248;
					4,0,2:1977;4,0,1:2133;4,0,0:2338;4,1,2:2005;4,1,1:2167;4,1,0:2379;4,2,2:2036;4,2,1:2203;4,2,0:2397;4,3,2:2071;4,3,1:2242;4,3,0:2397;4,4,2:2105;4,4,1:2283;4,4,0:2397;4,5,2:2140;4,5,1:2323;4,5,0:2397;4,6,2:2177;4,6,1:2364;4,6,0:2397;4,7,2:2216;4,7,1:2397;4,7,0:2397;4,8,2:2256;4,8,1:2397;4,8,0:2396;4,9,2:2297;4,9,1:2397;4,9,0:2395;4,10,2:2341;4,10,1:2397;4,10,0:2397;4,11,2:2255;4,11,1:2339;4,11,0:2319;4,12,2:2154;4,12,1:2237;4,12,0:2216;4,13,2:2058;4,13,1:2139;4,13,0:2118;4,14,2:1964;4,14,1:2044;4,14,0:2022;4,15,2:1875;4,15,1:1952;4,15,0:1929;4,16,2:1789;4,16,1:1863;4,16,0:1840;4,17,2:1706;4,17,1:1778;4,17,0:1754;4,18,2:1626;4,18,1:1695;4,18,0:1670;4,19,2:1549;4,19,1:1615;4,19,0:1590;4,20,2:1474;4,20,1:1537;4,20,0:1512;4,21,2:1401;4,21,1:1463;4,21,0:1435;4,22,2:1333;4,22,1:1392;4,22,0:1365;4,23,2:1264;4,23,1:1323;4,23,0:1294;
					3,0,2:1959;3,0,1:2111;3,0,0:2313;3,1,2:1989;3,1,1:2145;3,1,0:2353;3,2,2:2018;3,2,1:2179;3,2,0:2394;3,3,2:2053;3,3,1:2217;3,3,0:2397;3,4,2:2086;3,4,1:2258;3,4,0:2397;3,5,2:2121;3,5,1:2298;3,5,0:2397;3,6,2:2157;3,6,1:2338;3,6,0:2397;3,7,2:2195;3,7,1:2379;3,7,0:2397;3,8,2:2235;3,8,1:2397;3,8,0:2397;3,9,2:2276;3,9,1:2396;3,9,0:2396;3,10,2:2319;3,10,1:2397;3,10,0:2397;3,11,2:2343;3,11,1:2397;3,11,0:2397;3,12,2:2240;3,12,1:2306;3,12,0:2293;3,13,2:2141;3,13,1:2206;3,13,0:2193;3,14,2:2044;3,14,1:2110;3,14,0:2096;3,15,2:1950;3,15,1:2015;3,15,0:2002;3,16,2:1860;3,16,1:1924;3,16,0:1911;3,17,2:1773;3,17,1:1836;3,17,0:1821;3,18,2:1689;3,18,1:1751;3,18,0:1735;3,19,2:1607;3,19,1:1669;3,19,0:1652;3,20,2:1528;3,20,1:1589;3,20,0:1572;3,21,2:1453;3,21,1:1512;3,21,0:1493;3,22,2:1383;3,22,1:1440;3,22,0:1421;3,23,2:1313;3,23,1:1368;3,23,0:1347;
					2,0,2:1943;2,0,1:2089;2,0,0:2286;2,1,2:1971;2,1,1:2123;2,1,0:2327;2,2,2:2000;2,2,1:2156;2,2,0:2368;2,3,2:2032;2,3,1:2193;2,3,0:2397;2,4,2:2067;2,4,1:2233;2,4,0:2397;2,5,2:2102;2,5,1:2272;2,5,0:2399;2,6,2:2138;2,6,1:2312;2,6,0:2397;2,7,2:2175;2,7,1:2353;2,7,0:2397;2,8,2:2213;2,8,1:2395;2,8,0:2397;2,9,2:2255;2,9,1:2397;2,9,0:2397;2,10,2:2298;2,10,1:2396;2,10,0:2397;2,11,2:2341;2,11,1:2397;2,11,0:2396;2,12,2:2313;2,12,1:2366;2,12,0:2363;2,13,2:2211;2,13,1:2264;2,13,0:2260;2,14,2:2113;2,14,1:2165;2,14,0:2160;2,15,2:2018;2,15,1:2070;2,15,0:2063;2,16,2:1927;2,16,1:1978;2,16,0:1970;2,17,2:1839;2,17,1:1889;2,17,0:1880;2,18,2:1753;2,18,1:1803;2,18,0:1793;2,19,2:1670;2,19,1:1719;2,19,0:1709;2,20,2:1591;2,20,1:1639;2,20,0:1627;2,21,2:1515;2,21,1:1562;2,21,0:1549;2,22,2:1442;2,22,1:1489;2,22,0:1476;2,23,2:1369;2,23,1:1417;2,23,0:1402;
					1,0,2:1927;1,0,1:2067;1,0,0:2260;1,1,2:1953;1,1,1:2101;1,1,0:2300;1,2,2:1983;1,2,1:2135;1,2,0:2341;1,3,2:2013;1,3,1:2169;1,3,0:2382;1,4,2:2048;1,4,1:2207;1,4,0:2397;1,5,2:2082;1,5,1:2246;1,5,0:2397;1,6,2:2118;1,6,1:2285;1,6,0:2397;1,7,2:2155;1,7,1:2326;1,7,0:2397;1,8,2:2192;1,8,1:2368;1,8,0:2397;1,9,2:2233;1,9,1:2396;1,9,0:2397;1,10,2:2277;1,10,1:2396;1,10,0:2397;1,11,2:2321;1,11,1:2397;1,11,0:2397;1,12,2:2367;1,12,1:2397;1,12,0:2397;1,13,2:2285;1,13,1:2324;1,13,0:2331;1,14,2:2184;1,14,1:2223;1,14,0:2228;1,15,2:2085;1,15,1:2125;1,15,0:2128;1,16,2:1991;1,16,1:2030;1,16,0:2031;1,17,2:1900;1,17,1:1939;1,17,0:1939;1,18,2:1812;1,18,1:1851;1,18,0:1850;1,19,2:1727;1,19,1:1766;1,19,0:1763;1,20,2:1645;1,20,1:1684;1,20,0:1680;1,21,2:1566;1,21,1:1605;1,21,0:1599;1,22,2:1492;1,22,1:1530;1,22,0:1524;1,23,2:1419;1,23,1:1456;1,23,0:1448;
					0,0,2:1912;0,0,1:2049;0,0,0:2239;0,1,2:1940;0,1,1:2083;0,1,0:2278;0,2,2:1967;0,2,1:2116;0,2,0:2319;0,3,2:1998;0,3,1:2150;0,3,0:2360;0,4,2:2032;0,4,1:2187;0,4,0:2397;0,5,2:2066;0,5,1:2225;0,5,0:2397;0,6,2:2102;0,6,1:2264;0,6,0:2397;0,7,2:2140;0,7,1:2304;0,7,0:2397;0,8,2:2179;0,8,1:2346;0,8,0:2397;0,9,2:2218;0,9,1:2385;0,9,0:2397;0,10,2:2263;0,10,1:2396;0,10,0:2396;0,11,2:2307;0,11,1:2397;0,11,0:2397;0,12,2:2353;0,12,1:2397;0,12,0:2397;0,13,2:2344;0,13,1:2376;0,13,0:2386;0,14,2:2241;0,14,1:2271;0,14,0:2281;0,15,2:2141;0,15,1:2170;0,15,0:2180;0,16,2:2045;0,16,1:2074;0,16,0:2082;0,17,2:1952;0,17,1:1981;0,17,0:1988;0,18,2:1862;0,18,1:1892;0,18,0:1897;0,19,2:1775;0,19,1:1805;0,19,0:1809;0,20,2:1691;0,20,1:1722;0,20,0:1724;0,21,2:1611;0,21,1:1641;0,21,0:1642;0,22,2:1534;0,22,1:1565;0,22,0:1564;0,23,2:1459;0,23,1:1489;0,23,0:1488;
			</Output>
		</MultiDimensionsTable>
	</Function>

	<EnginePage>
		<Gauge>
			<Type>Circular</Type>
			<Style>
				<BeginAngle>-50</BeginAngle>
				<EndAngle>190</EndAngle>
				<ValuePos>End</ValuePos>
				<CursorType>Triangle</CursorType>
				<SizePercent>90</SizePercent>
			</Style>
			<BeginText></BeginText>
			<EndText></EndText>
			<ID>Turbo_TorqueGauge</ID>
			<Title>FT-LB</Title>
			<Unit>x100</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="TURB ENG FREE TURBINE TORQUE:1" unit="Foot pounds"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>
					<Function Name="TorqueRedLine"/>
				</End>
				<SmoothFactor>0.2</SmoothFactor>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>
					<Function Name="TorqueRedLine"/>
				</Position>
				<SmoothFactor>0.2</SmoothFactor>
			</ColorLine>
			<GraduationLength>100</GraduationLength>
			<GraduationTextLength>500</GraduationTextLength>
			<RedBlink>
				<Greater>
					<Simvar name="TURB ENG FREE TURBINE TORQUE:1" unit="Foot pounds"/>
					<Function Name="TorqueRedLine"/>
				</Greater>
			</RedBlink>
			<ReferenceBug>
				<Style>
					<Color>#00ccff</Color>
				</Style>
				<DisplayLogic>
					<And>
						<GreaterEqual>
							<Simvar name="PROP RPM:1" unit="rpm"/>
							<Constant>1600</Constant>
						</GreaterEqual>
						<LowerEqual>
							<Simvar name="PROP RPM:1" unit="rpm"/>
							<Constant>1900</Constant>
						</LowerEqual>
					</And>
				</DisplayLogic>
				<Position>
					<Function Name="MaximumCruiseTorqueBug"/>
				</Position>
			</ReferenceBug>
		</Gauge>

		<Gauge>
			<Type>Circular</Type>
			<Style>
				<BeginAngle>-10</BeginAngle>
				<EndAngle>160</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
				<SizePercent>90</SizePercent>
			</Style>
			<BeginText></BeginText>
			<EndText></EndText>
			<ID>Turbo_IttGauge</ID>
			<Title>ITT</Title>
			<Unit>°C</Unit>
			<Minimum>0</Minimum>
			<Maximum>
				<StateMachine>
					<State id="Start" value="1100">
						<Transition to="Normal">
							<Greater>
								<Simvar name="TURB ENG N1:1" unit="percent"/>
								<Constant>52</Constant>
							</Greater>
						</Transition>
					</State>
					<State id="Normal" value="950">
						<Transition to="Start">
							<Lower>
								<Simvar name="TURB ENG N1:1" unit="percent"/>
								<Constant>10</Constant>
							</Lower>
						</Transition>
					</State>
				</StateMachine>
			</Maximum>
			<Value>
				<Simvar name="TURB ENG1 ITT" unit="celsius"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>100</Begin>
				<End>805</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>805</Begin>
				<End>825</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>825</Begin>
				<End>850</End>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>
					<StateMachine>
						<State id="Start" value="1090">
							<Transition to="Normal">
								<Greater>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>52</Constant>
								</Greater>
							</Transition>
						</State>
						<State id="Normal" value="850">
							<Transition to="Start">
								<Lower>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>10</Constant>
								</Lower>
							</Transition>
						</State>
					</StateMachine>
				</Position>
			</ColorLine>

			<RedBlink>
				<Greater>
					<Simvar name="TURB ENG1 ITT" unit="celsius"/>
					<StateMachine>
						<State id="Start" value="1090">
							<Transition to="Normal">
								<Greater>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>52</Constant>
								</Greater>
							</Transition>
						</State>
						<State id="Normal" value="850">
							<Transition to="Start">
								<Lower>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>10</Constant>
								</Lower>
							</Transition>
						</State>
					</StateMachine>
				</Greater>
			</RedBlink>
			<GraduationLength>50</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>Circular</Type>
			<Style>
				<BeginAngle>-10</BeginAngle>
				<EndAngle>160</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
				<SizePercent>90</SizePercent>
			</Style>
			<BeginText></BeginText>
			<EndText></EndText>
			<ID>Turbo_NgGauge</ID>
			<Title>NG</Title>
			<Unit>% RPM</Unit>
			<Minimum>10</Minimum>
			<Maximum>110</Maximum>
			<Value>
				<Simvar name="TURB ENG N2:1" unit="percent"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>51</Begin>
				<End>101.6</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>101.6</Begin>
				<End>104</End>
			</ColorZone>
			<GraduationLength>10</GraduationLength>
			<RedBlink>
				<Greater>
					<Simvar name="TURB ENG N2:1" unit="percent"/>
					<Constant>101.6</Constant>
				</Greater>
			</RedBlink>
		</Gauge>

		<Text>
			<Style>
				<Margins>
					<Top>20</Top>
				</Margins>
			</Style>
			<Center>---------------------------------</Center>
		</Text>

		<Text>
			<Style>
				<Margins>
					<Bottom>10</Bottom>
				</Margins>
			</Style>
			<Left>Prop RPM</Left>
			<Right id="Turbo_RPMGauge">
				<Content>
					<ToFixed precision="0">
						<Simvar name="PROP RPM:1" unit="rpm"/>
					</ToFixed>
				</Content>
				<Color>
					<If>
						<Condition>
							<Greater>
								<Simvar name="PROP RPM:1" unit="rpm"/>
								<Constant>1600</Constant>
							</Greater>
						</Condition>
						<Then>
							<If>
								<Condition>
									<Greater>
										<Simvar name="PROP RPM:1" unit="rpm"/>
										<Constant>1900</Constant>
									</Greater>
								</Condition>
								<Then>
									<Constant>red</Constant>
								</Then>
								<Else>
									<Constant>green</Constant>
								</Else>
							</If>
						</Then>
						<Else>
							<Constant>white</Constant>
						</Else>
					</If>
				</Color>
			</Right>
		</Text>

		<Gauge>
			<Type>Horizontal</Type>
			<Style>
				<ValuePos>End</ValuePos>
			</Style>
			<ID>Turbo_OilPressGauge</ID>
			<Title>Oil</Title>
			<Unit>PSI</Unit>
			<Minimum>0</Minimum>
			<Maximum>120</Maximum>
			<Value>
				<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>85</Begin>
				<End>105</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>40</Begin>
				<End>85</End>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>40</Position>
			</ColorLine>
			<ColorLine>
				<Color>red</Color>
				<Position>105</Position>
			</ColorLine>
			<BeginText></BeginText>
			<EndText></EndText>
			<RedBlink>
				<Or>
					<Greater>
						<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
						<Constant>101.6</Constant>
					</Greater>
					<Lower>
						<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
						<Constant>40</Constant>
					</Lower>
				</Or>
			</RedBlink>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<Style>
				<ValuePos>End</ValuePos>
			</Style>
			<ID>Turbo_OilTempGauge</ID>
			<Title>Oil</Title>
			<Unit>°C</Unit>
			<Minimum>-50</Minimum>
			<Maximum>120</Maximum>
			<Value>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>10</Begin>
				<End>100</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>-40</Begin>
				<End>10</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>100</Begin>
				<End>105</End>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>-41</Position>
			</ColorLine>
			<ColorLine>
				<Color>red</Color>
				<Position>105</Position>
			</ColorLine>
			<BeginText></BeginText>
			<EndText></EndText>
			<RedBlink>
				<Or>
					<Greater>
						<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
						<Constant>105</Constant>
					</Greater>
					<Lower>
						<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
						<Constant>-41</Constant>
					</Lower>
				</Or>
			</RedBlink>
		</Gauge>

		<Text>
			<Style>
				<Margins>
					<Top>10</Top>
				</Margins>
			</Style>
			<Left>L</Left>
			<Center>Fuel Qty</Center>
			<Right>R</Right>
		</Text>

		<Gauge>
			<Type>DoubleVertical</Type>
			<ID>Turbo_FuelGauge</ID>
			<Title></Title>
			<Unit>LBS</Unit>
			<Minimum>0</Minimum>
			<Maximum>1100</Maximum>
			<Style>
				<Height>70</Height>
			</Style>
			<Value>
				<Multiply>
					<Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
					<Simvar name="FUEL WEIGHT PER GALLON" unit="pounds"/>
				</Multiply>
			</Value>
			<Value2>
				<Multiply>
					<Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
					<Simvar name="FUEL WEIGHT PER GALLON" unit="pounds"/>
				</Multiply>
			</Value2>
			<ColorLine>
				<Color>red</Color>
				<Position>0</Position>
			</ColorLine>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>
				<End>25</End>
			</ColorZone>
			<GraduationLength text="True">200</GraduationLength>
			<EndText></EndText>
		</Gauge>

		<Text>
			<Style>
				<Margins>
					<Top>10</Top>
				</Margins>
			</Style>
			<Left>FFlow PPH</Left>
			<Right id="FuelFlow">
				<ToFixed precision="0">
					<Simvar name="ENG FUEL FLOW PPH:1" unit="Pounds per hour"/>
				</ToFixed>
			</Right>
		</Text>
	</EnginePage>

	<SystemPage>
		<Gauge>
			<Type>Circular</Type>
			<Style>
				<BeginAngle>-50</BeginAngle>
				<EndAngle>190</EndAngle>
				<ValuePos>End</ValuePos>
				<CursorType>Triangle</CursorType>
				<SizePercent>90</SizePercent>
			</Style>
			<BeginText></BeginText>
			<EndText></EndText>
			<ID>Turbo_TorqueGauge</ID>
			<Title>FT-LB</Title>
			<Unit>x100</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="TURB ENG FREE TURBINE TORQUE:1" unit="Foot pounds"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>
					<Function Name="TorqueRedLine"/>
				</End>
				<SmoothFactor>0.2</SmoothFactor>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>
					<Function Name="TorqueRedLine"/>
				</Position>
				<SmoothFactor>0.2</SmoothFactor>
			</ColorLine>
			<GraduationLength>100</GraduationLength>
			<GraduationTextLength>500</GraduationTextLength>
			<RedBlink>
				<Greater>
					<Simvar name="TURB ENG FREE TURBINE TORQUE:1" unit="Foot pounds"/>
					<Function Name="TorqueRedLine"/>
				</Greater>
			</RedBlink>
			<ReferenceBug>
				<Style>
					<Color>#00ccff</Color>
				</Style>
				<DisplayLogic>
					<And>
						<GreaterEqual>
							<Simvar name="PROP RPM:1" unit="rpm"/>
							<Constant>1600</Constant>
						</GreaterEqual>
						<LowerEqual>
							<Simvar name="PROP RPM:1" unit="rpm"/>
							<Constant>1900</Constant>
						</LowerEqual>
					</And>
				</DisplayLogic>
				<Position>
					<Function Name="MaximumCruiseTorqueBug"/>
				</Position>
			</ReferenceBug>
		</Gauge>

		<Gauge>
			<Type>Circular</Type>
			<Style>
				<BeginAngle>-10</BeginAngle>
				<EndAngle>160</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
				<SizePercent>90</SizePercent>
			</Style>
			<BeginText></BeginText>
			<EndText></EndText>
			<ID>Turbo_IttGauge</ID>
			<Title>ITT</Title>
			<Unit>°C</Unit>
			<Minimum>0</Minimum>
			<Maximum>
				<StateMachine>
					<State id="Start" value="1100">
						<Transition to="Normal">
							<Greater>
								<Simvar name="TURB ENG N1:1" unit="percent"/>
								<Constant>52</Constant>
							</Greater>
						</Transition>
					</State>
					<State id="Normal" value="950">
						<Transition to="Start">
							<Lower>
								<Simvar name="TURB ENG N1:1" unit="percent"/>
								<Constant>10</Constant>
							</Lower>
						</Transition>
					</State>
				</StateMachine>
			</Maximum>
			<Value>
				<Simvar name="TURB ENG1 ITT" unit="celsius"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>100</Begin>
				<End>805</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>805</Begin>
				<End>825</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>825</Begin>
				<End>850</End>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>
					<StateMachine>
						<State id="Start" value="1090">
							<Transition to="Normal">
								<Greater>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>52</Constant>
								</Greater>
							</Transition>
						</State>
						<State id="Normal" value="850">
							<Transition to="Start">
								<Lower>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>10</Constant>
								</Lower>
							</Transition>
						</State>
					</StateMachine>
				</Position>
			</ColorLine>
			<RedBlink>
				<Greater>
					<Simvar name="TURB ENG1 ITT" unit="celsius"/>
					<StateMachine>
						<State id="Start" value="1090">
							<Transition to="Normal">
								<Greater>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>52</Constant>
								</Greater>
							</Transition>
						</State>
						<State id="Normal" value="850">
							<Transition to="Start">
								<Lower>
									<Simvar name="TURB ENG N1:1" unit="percent"/>
									<Constant>10</Constant>
								</Lower>
							</Transition>
						</State>
					</StateMachine>
				</Greater>
			</RedBlink>
			<GraduationLength>50</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>Circular</Type>
			<Style>
				<BeginAngle>-10</BeginAngle>
				<EndAngle>160</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
				<SizePercent>90</SizePercent>
			</Style>
			<BeginText></BeginText>
			<EndText></EndText>
			<ID>Turbo_NgGauge</ID>
			<Title>NG</Title>
			<Unit>% RPM</Unit>
			<Minimum>10</Minimum>
			<Maximum>110</Maximum>
			<Value>
				<Simvar name="TURB ENG N2:1" unit="percent"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>51</Begin>
				<End>101.6</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>101.6</Begin>
				<End>104</End>
			</ColorZone>
			<GraduationLength>10</GraduationLength>
			<RedBlink>
				<Greater>
					<Simvar name="TURB ENG N2:1" unit="percent"/>
					<Constant>101.6</Constant>
				</Greater>
			</RedBlink>
		</Gauge>

		<Text>
			<Center>---------------------------------</Center>
		</Text>

		<Text>
			<Left>Prop RPM</Left>
			<Right>
				<Content>
					<ToFixed precision="0">
						<Simvar name="PROP RPM:1" unit="rpm"/>
					</ToFixed>
				</Content>
				<Color>
					<If>
						<Condition>
							<Greater>
								<Simvar name="PROP RPM:1" unit="rpm"/>
								<Constant>1600</Constant>
							</Greater>
						</Condition>
						<Then>
							<If>
								<Condition>
									<Greater>
										<Simvar name="PROP RPM:1" unit="rpm"/>
										<Constant>1900</Constant>
									</Greater>
								</Condition>
								<Then>
									<Constant>red</Constant>
								</Then>
								<Else>
									<Constant>green</Constant>
								</Else>
							</If>
						</Then>
						<Else>
							<Constant>white</Constant>
						</Else>
					</If>
				</Color>
			</Right>
		</Text>

		<Text>
			<Left>------------</Left>
			<Center>Fuel</Center>
			<Right>------------</Right>
		</Text>

		<Text>
			<Left>Qty L LBS</Left>
			<Right>
				<ToFixed precision="0">
					<Multiply>
						<Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
						<Simvar name="FUEL WEIGHT PER GALLON" unit="pounds"/>
					</Multiply>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Qty R LBS</Left>
			<Right>
				<ToFixed precision="0">
					<Multiply>
						<Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
						<Simvar name="FUEL WEIGHT PER GALLON" unit="pounds"/>
					</Multiply>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>FFlow PPH</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="ENG FUEL FLOW PPH:1" unit="Pounds per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>--</Left>
			<Center>Fuel Totalizer</Center>
			<Right>--</Right>
		</Text>

		<Text>
			<Left>LB Rem</Left>
			<Right>
				<ToFixed precision="0">
					<Multiply>
						<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
						<Simvar name="FUEL WEIGHT PER GALLON" unit="pounds"/>
					</Multiply>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>LB Used</Left>
			<Right>
				<ToFixed precision="0">
					<Multiply>
						<Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
						<Simvar name="FUEL WEIGHT PER GALLON" unit="pounds"/>
					</Multiply>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>------</Left>
			<Center>Electrical</Center>
			<Right>-----</Right>
		</Text>

		<Text>
			<Left>Gen Amps</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="ELECTRICAL GENALT BUS AMPS:1" unit="amps"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Alt Amps</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="ELECTRICAL GENALT BUS AMPS:1" unit="amps"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Bat Amps</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="ELECTRICAL BATTERY BUS AMPS" unit="amps"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Bus VoltsS</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="ELECTRICAL MAIN BUS VOLTAGE" unit="volts"/>
				</ToFixed>
			</Right>
		</Text>
		<SystemPage/>
	</EngineDisplay>
`;